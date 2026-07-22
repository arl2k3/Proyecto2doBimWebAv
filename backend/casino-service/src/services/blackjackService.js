const { BlackjackGame } = require('../models');
const { sequelize } = require('../config/db');
const walletClient = require('../clients/walletClient');

const WALLET_SOURCE = 'casino';

// ─── Utilidades de baraja ──────────────────────────────────────────────────

const SUITS  = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

function shuffle(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function cardNumericValue(card) {
  if (['J', 'Q', 'K'].includes(card.value)) return 10;
  if (card.value === 'A') return 11;
  return parseInt(card.value, 10);
}

function calcScore(cards) {
  let score = 0;
  let aces  = 0;
  for (const card of cards) {
    const v = cardNumericValue(card);
    score += v;
    if (card.value === 'A') aces++;
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

function drawCard(deck) {
  const card = deck.shift();
  return { card, deck };
}

function canSplit(playerCards) {
  if (!playerCards || !Array.isArray(playerCards) || playerCards.length !== 2) return false;
  const val1 = cardNumericValue(playerCards[0]);
  const val2 = cardNumericValue(playerCards[1]);
  return val1 === val2;
}

async function creditPayout(userId, amount, reference) {
  if (!amount || amount <= 0) return walletClient.getBalance(userId);
  return walletClient.credit(userId, amount, {
    reference,
    description: 'Pago Blackjack',
    source: WALLET_SOURCE,
  });
}

// ─── Servicio ──────────────────────────────────────────────────────────────

async function startGame(userId, betAmount) {
  const bet = parseFloat(betAmount);
  if (isNaN(bet) || bet <= 0) {
    const err = new Error('La apuesta debe ser un número positivo.');
    err.statusCode = 400;
    throw err;
  }

  const balance = await walletClient.getBalance(userId);
  if (balance < bet) {
    const err = new Error('Saldo insuficiente para iniciar la partida.');
    err.statusCode = 400;
    throw err;
  }

  const activeGame = await BlackjackGame.findOne({
    where: { userId, status: 'in_progress' },
  });
  if (activeGame) {
    const err = new Error('Ya tienes una partida de Blackjack en curso.');
    err.statusCode = 400;
    throw err;
  }

  let currentBalance = await walletClient.debit(userId, bet, {
    reference: 'BLACKJACK_BET',
    description: 'Apuesta Blackjack',
    source: WALLET_SOURCE,
  });

  const transaction = await sequelize.transaction();
  try {
    let deck = shuffle(buildDeck());
    let playerCards = [];
    let dealerCards = [];

    ({ card: playerCards[0], deck } = drawCard(deck));
    ({ card: dealerCards[0], deck } = drawCard(deck));
    ({ card: playerCards[1], deck } = drawCard(deck));
    ({ card: dealerCards[1], deck } = drawCard(deck));

    const playerScore = calcScore(playerCards);
    const dealerScore = calcScore(dealerCards);

    let status = 'in_progress';
    let payout = 0;

    if (playerScore === 21) {
      if (dealerScore === 21) {
        status = 'push';
        payout = bet;
      } else {
        status = 'blackjack';
        payout = bet * 2.5;
      }
    }

    const game = await BlackjackGame.create({
      userId,
      bet,
      playerCards: JSON.stringify(playerCards),
      dealerCards:  JSON.stringify(dealerCards),
      deck:         JSON.stringify(deck),
      playerScore,
      dealerScore,
      status,
      payout,
    }, { transaction });

    await transaction.commit();

    if (payout > 0) {
      currentBalance = await creditPayout(userId, payout, 'BLACKJACK_PAYOUT');
    }

    return buildGameResponse(game, currentBalance, status === 'in_progress');
  } catch (err) {
    try { await transaction.rollback(); } catch (_) {}
    try {
      await walletClient.credit(userId, bet, {
        reference: 'BLACKJACK_ROLLBACK',
        description: 'Reversión apuesta Blackjack',
        source: WALLET_SOURCE,
      });
    } catch (_) {}
    throw err;
  }
}

async function hit(userId) {
  const transaction = await sequelize.transaction();
  try {
    const game = await BlackjackGame.findOne({
      where: { userId, status: 'in_progress' },
      transaction, lock: true,
    });
    if (!game) {
      const err = new Error('No hay ninguna partida activa.');
      err.statusCode = 400;
      throw err;
    }

    let deck = JSON.parse(game.deck);
    let playerCards = JSON.parse(game.playerCards);
    let dealerCards = JSON.parse(game.dealerCards);

    const isSplit = playerCards && typeof playerCards === 'object' && playerCards.isSplit;

    let status = 'in_progress';
    let payout = 0;
    let playerScore = 0;
    let balance = await walletClient.getBalance(userId);

    if (isSplit) {
      const activeIdx = playerCards.activeHandIndex;
      const hand = playerCards.hands[activeIdx];

      let newCard;
      ({ card: newCard, deck } = drawCard(deck));
      hand.push(newCard);

      playerScore = calcScore(hand);

      if (playerScore > 21) {
        if (activeIdx === 0) {
          playerCards.activeHandIndex = 1;
          playerScore = calcScore(playerCards.hands[1]);
        } else {
          const hand1Score = calcScore(playerCards.hands[0]);
          const hand2Score = calcScore(playerCards.hands[1]);

          if (hand1Score > 21 && hand2Score > 21) {
            status = 'bust';
            payout = 0;
          } else {
            const result = await dealerPlay(dealerCards, deck, { hand1Score, hand2Score }, playerCards.handBets, true);
            status = result.status;
            payout = result.payout;
            deck = result.deck;
            dealerCards = result.dealerCards;

            balance = await creditPayout(userId, payout, 'BLACKJACK_PAYOUT');
          }
        }
      } else if (playerScore === 21) {
        if (activeIdx === 0) {
          playerCards.activeHandIndex = 1;
          playerScore = calcScore(playerCards.hands[1]);
        } else {
          const hand1Score = calcScore(playerCards.hands[0]);
          const hand2Score = calcScore(playerCards.hands[1]);

          const result = await dealerPlay(dealerCards, deck, { hand1Score, hand2Score }, playerCards.handBets, true);
          status = result.status;
          payout = result.payout;
          deck = result.deck;
          dealerCards = result.dealerCards;

          balance = await creditPayout(userId, payout, 'BLACKJACK_PAYOUT');
        }
      }

      await game.update({
        playerCards: JSON.stringify(playerCards),
        deck: JSON.stringify(deck),
        dealerCards: JSON.stringify(dealerCards),
        playerScore: isSplit ? calcScore(playerCards.hands[playerCards.activeHandIndex]) : playerScore,
        dealerScore: calcScore(dealerCards),
        status,
        payout,
      }, { transaction });

      await transaction.commit();

      return buildGameResponse(
        { ...game.toJSON(), playerCards: JSON.stringify(playerCards), dealerCards: JSON.stringify(dealerCards), playerScore: isSplit ? calcScore(playerCards.hands[playerCards.activeHandIndex]) : playerScore, dealerScore: calcScore(dealerCards), status, payout },
        balance,
        status === 'in_progress'
      );
    }

    let newCard;
    ({ card: newCard, deck } = drawCard(deck));
    playerCards.push(newCard);

    playerScore = calcScore(playerCards);

    if (playerScore > 21) {
      status = 'bust';
      payout = 0;
    } else if (playerScore === 21) {
      const result = await dealerPlay(dealerCards, deck, playerScore, game.bet, false);
      status  = result.status;
      payout  = result.payout;
      deck    = result.deck;
      dealerCards = result.dealerCards;

      balance = await creditPayout(userId, payout, 'BLACKJACK_PAYOUT');
    }

    await game.update({
      playerCards:  JSON.stringify(playerCards),
      deck:         JSON.stringify(deck),
      dealerCards:  JSON.stringify(dealerCards),
      playerScore,
      dealerScore:  calcScore(dealerCards),
      status,
      payout,
    }, { transaction });

    await transaction.commit();

    return buildGameResponse(
      { ...game.toJSON(), playerCards: JSON.stringify(playerCards), dealerCards: JSON.stringify(dealerCards), playerScore, dealerScore: calcScore(dealerCards), status, payout },
      balance,
      status === 'in_progress'
    );
  } catch (err) {
    try { await transaction.rollback(); } catch (_) {}
    throw err;
  }
}

async function stand(userId) {
  const transaction = await sequelize.transaction();
  try {
    const game = await BlackjackGame.findOne({
      where: { userId, status: 'in_progress' },
      transaction, lock: true,
    });
    if (!game) {
      const err = new Error('No hay ninguna partida activa.');
      err.statusCode = 400;
      throw err;
    }

    let deck = JSON.parse(game.deck);
    let dealerCards = JSON.parse(game.dealerCards);
    let playerCards = JSON.parse(game.playerCards);

    const isSplit = playerCards && typeof playerCards === 'object' && playerCards.isSplit;
    let balance = await walletClient.getBalance(userId);

    if (isSplit) {
      const activeIdx = playerCards.activeHandIndex;

      if (activeIdx === 0) {
        playerCards.activeHandIndex = 1;

        await game.update({
          playerCards: JSON.stringify(playerCards),
          playerScore: calcScore(playerCards.hands[1]),
        }, { transaction });

        await transaction.commit();

        return buildGameResponse(
          { ...game.toJSON(), playerCards: JSON.stringify(playerCards), playerScore: calcScore(playerCards.hands[1]) },
          balance,
          true
        );
      }

      const hand1Score = calcScore(playerCards.hands[0]);
      const hand2Score = calcScore(playerCards.hands[1]);

      const result = await dealerPlay(dealerCards, deck, { hand1Score, hand2Score }, playerCards.handBets, true);

      balance = await creditPayout(userId, result.payout, 'BLACKJACK_PAYOUT');

      await game.update({
        playerCards: JSON.stringify(playerCards),
        dealerCards: JSON.stringify(result.dealerCards),
        dealerScore: result.dealerScore,
        deck: JSON.stringify(result.deck),
        status: result.status,
        payout: result.payout,
        playerScore: calcScore(playerCards.hands[1]),
      }, { transaction });

      await transaction.commit();

      return buildGameResponse(
        { ...game.toJSON(), playerCards: JSON.stringify(playerCards), dealerCards: JSON.stringify(result.dealerCards), dealerScore: result.dealerScore, status: result.status, payout: result.payout, playerScore: calcScore(playerCards.hands[1]) },
        balance,
        false
      );
    }

    const playerScore = game.playerScore;
    const result = await dealerPlay(dealerCards, deck, playerScore, game.bet, false);

    balance = await creditPayout(userId, result.payout, 'BLACKJACK_PAYOUT');

    await game.update({
      dealerCards: JSON.stringify(result.dealerCards),
      dealerScore: result.dealerScore,
      deck:        JSON.stringify(result.deck),
      status:      result.status,
      payout:      result.payout,
    }, { transaction });

    await transaction.commit();

    return buildGameResponse(
      { ...game.toJSON(), dealerCards: JSON.stringify(result.dealerCards), dealerScore: result.dealerScore, status: result.status, payout: result.payout },
      balance,
      false
    );
  } catch (err) {
    try { await transaction.rollback(); } catch (_) {}
    throw err;
  }
}

async function double(userId) {
  const transaction = await sequelize.transaction();
  try {
    const game = await BlackjackGame.findOne({
      where: { userId, status: 'in_progress' },
      transaction, lock: true,
    });
    if (!game) {
      const err = new Error('No hay ninguna partida activa.');
      err.statusCode = 400;
      throw err;
    }

    let playerCards = JSON.parse(game.playerCards);
    if (playerCards && typeof playerCards === 'object' && playerCards.isSplit) {
      const err = new Error('No se permite doblar en una mano dividida.');
      err.statusCode = 400;
      throw err;
    }

    if (playerCards.length !== 2) {
      const err = new Error('Solo puedes doblar con las dos cartas iniciales.');
      err.statusCode = 400;
      throw err;
    }

    const additionalBet = parseFloat(game.bet);
    const balanceBefore = await walletClient.getBalance(userId);

    if (balanceBefore < additionalBet) {
      const err = new Error('Saldo insuficiente para doblar la apuesta.');
      err.statusCode = 400;
      throw err;
    }

    let balance = await walletClient.debit(userId, additionalBet, {
      reference: 'BLACKJACK_DOUBLE',
      description: 'Doble apuesta Blackjack',
      source: WALLET_SOURCE,
    });

    const newBet = additionalBet * 2;

    let deck = JSON.parse(game.deck);
    let dealerCards = JSON.parse(game.dealerCards);

    let newCard;
    ({ card: newCard, deck } = drawCard(deck));
    playerCards.push(newCard);

    const playerScore = calcScore(playerCards);
    let status, payout;

    if (playerScore > 21) {
      status = 'bust';
      payout = 0;
    } else {
      const result = await dealerPlay(dealerCards, deck, playerScore, newBet, false);
      status = result.status;
      payout = result.payout;
      deck = result.deck;
      dealerCards = result.dealerCards;
    }

    try {
      balance = await creditPayout(userId, payout, 'BLACKJACK_PAYOUT');

      await game.update({
        bet: newBet,
        playerCards: JSON.stringify(playerCards),
        dealerCards: JSON.stringify(dealerCards),
        deck: JSON.stringify(deck),
        playerScore,
        dealerScore: calcScore(dealerCards),
        status,
        payout,
      }, { transaction });

      await transaction.commit();

      return buildGameResponse(
        { ...game.toJSON(), bet: newBet, playerCards: JSON.stringify(playerCards), dealerCards: JSON.stringify(dealerCards), playerScore, dealerScore: calcScore(dealerCards), status, payout },
        balance,
        false
      );
    } catch (updateErr) {
      try {
        await walletClient.credit(userId, additionalBet, {
          reference: 'BLACKJACK_DOUBLE_ROLLBACK',
          description: 'Reversión doble apuesta Blackjack',
          source: WALLET_SOURCE,
        });
      } catch (_) {}
      throw updateErr;
    }
  } catch (err) {
    try { await transaction.rollback(); } catch (_) {}
    throw err;
  }
}

async function split(userId) {
  const transaction = await sequelize.transaction();
  try {
    const game = await BlackjackGame.findOne({
      where: { userId, status: 'in_progress' },
      transaction, lock: true,
    });
    if (!game) {
      const err = new Error('No hay ninguna partida activa.');
      err.statusCode = 400;
      throw err;
    }

    let playerCards = JSON.parse(game.playerCards);
    if (playerCards && typeof playerCards === 'object' && playerCards.isSplit) {
      const err = new Error('Ya has dividido tus cartas.');
      err.statusCode = 400;
      throw err;
    }

    if (!canSplit(playerCards)) {
      const err = new Error('Solo puedes dividir si tienes dos cartas del mismo valor.');
      err.statusCode = 400;
      throw err;
    }

    const additionalBet = parseFloat(game.bet);
    const balanceBefore = await walletClient.getBalance(userId);

    if (balanceBefore < additionalBet) {
      const err = new Error('Saldo insuficiente para dividir las cartas.');
      err.statusCode = 400;
      throw err;
    }

    const balance = await walletClient.debit(userId, additionalBet, {
      reference: 'BLACKJACK_SPLIT',
      description: 'Apuesta adicional Split Blackjack',
      source: WALLET_SOURCE,
    });

    const newBet = additionalBet * 2;

    let deck = JSON.parse(game.deck);

    const rawHand1 = [playerCards[0]];
    const rawHand2 = [playerCards[1]];

    let card1, card2;
    ({ card: card1, deck } = drawCard(deck));
    ({ card: card2, deck } = drawCard(deck));

    const hand1 = [...rawHand1, card1];
    const hand2 = [...rawHand2, card2];

    const splitObj = {
      isSplit: true,
      hands: [hand1, hand2],
      activeHandIndex: 0,
      handBets: [additionalBet, additionalBet],
    };

    const playerScore = calcScore(hand1);

    try {
      await game.update({
        bet: newBet,
        playerCards: JSON.stringify(splitObj),
        deck: JSON.stringify(deck),
        playerScore,
        status: 'in_progress',
      }, { transaction });

      await transaction.commit();

      return buildGameResponse(
        { ...game.toJSON(), bet: newBet, playerCards: JSON.stringify(splitObj), playerScore, status: 'in_progress' },
        balance,
        true
      );
    } catch (updateErr) {
      try {
        await walletClient.credit(userId, additionalBet, {
          reference: 'BLACKJACK_SPLIT_ROLLBACK',
          description: 'Reversión apuesta Split Blackjack',
          source: WALLET_SOURCE,
        });
      } catch (_) {}
      throw updateErr;
    }
  } catch (err) {
    try { await transaction.rollback(); } catch (_) {}
    throw err;
  }
}

async function getActiveGame(userId) {
  const game = await BlackjackGame.findOne({
    where: { userId, status: 'in_progress' },
  });
  if (!game) return null;
  const balance = await walletClient.getBalance(userId);
  return buildGameResponse(game, balance, true);
}

async function getHistory(userId) {
  return BlackjackGame.findAll({
    where: { userId },
    order: [['created_at', 'DESC']],
    limit: 20,
    attributes: ['id', 'bet', 'playerScore', 'dealerScore', 'status', 'payout', ['created_at', 'createdAt']],
  });
}

async function dealerPlay(dealerCards, deck, playerScore, bet, isSplitHand = false) {
  let dc = [...dealerCards];
  let d  = [...deck];

  const bothBust = isSplitHand && playerScore.hand1Score > 21 && playerScore.hand2Score > 21;

  if (!bothBust) {
    while (calcScore(dc) < 17) {
      let newCard;
      ({ card: newCard, deck: d } = drawCard(d));
      dc.push(newCard);
    }
  }

  const dealerScore = calcScore(dc);
  let status, payout;

  if (isSplitHand) {
    const { hand1Score, hand2Score } = playerScore;
    const hand1Bet = bet[0];
    const hand2Bet = bet[1];

    let payout1 = 0;
    let payout2 = 0;

    if (hand1Score > 21) {
      payout1 = 0;
    } else if (dealerScore > 21) {
      payout1 = hand1Bet * 2;
    } else if (dealerScore === hand1Score) {
      payout1 = hand1Bet;
    } else if (hand1Score > dealerScore) {
      payout1 = hand1Bet * 2;
    }

    if (hand2Score > 21) {
      payout2 = 0;
    } else if (dealerScore > 21) {
      payout2 = hand2Bet * 2;
    } else if (dealerScore === hand2Score) {
      payout2 = hand2Bet;
    } else if (hand2Score > dealerScore) {
      payout2 = hand2Bet * 2;
    }

    payout = payout1 + payout2;
    const totalBet = hand1Bet + hand2Bet;

    if (payout > totalBet) {
      status = 'won';
    } else if (payout === totalBet) {
      status = 'push';
    } else {
      status = 'lost';
    }
  } else {
    if (dealerScore > 21) {
      status = 'won';
      payout = bet * 2;
    } else if (dealerScore === playerScore) {
      status = 'push';
      payout = bet;
    } else if (playerScore > dealerScore) {
      status = 'won';
      payout = bet * 2;
    } else {
      status = 'lost';
      payout = 0;
    }
  }

  return { dealerCards: dc, dealerScore, deck: d, status, payout };
}

function buildGameResponse(game, balance, hideDealer) {
  const pcParsed = typeof game.playerCards === 'string'
    ? JSON.parse(game.playerCards) : game.playerCards;
  const isSplit = pcParsed && typeof pcParsed === 'object' && pcParsed.isSplit;

  let dealerCards = typeof game.dealerCards === 'string'
    ? JSON.parse(game.dealerCards) : game.dealerCards;

  if (hideDealer && dealerCards.length >= 2) {
    dealerCards = [dealerCards[0], { suit: 'hidden', value: '?' }];
  }

  return {
    id:          game.id,
    bet:         parseFloat(game.bet),
    isSplit,
    playerCards: pcParsed,
    dealerCards,
    playerScore: isSplit ? calcScore(pcParsed.hands[pcParsed.activeHandIndex]) : calcScore(pcParsed || []),
    dealerScore: hideDealer ? cardNumericValue(JSON.parse(game.dealerCards || '[]')[0] || { value: '0' }) : game.dealerScore,
    status:      game.status,
    payout:      parseFloat(game.payout || 0),
    balance:     parseFloat(balance),
    canSplit:    !isSplit && canSplit(pcParsed),
    canDouble:   !isSplit && pcParsed && Array.isArray(pcParsed) && pcParsed.length === 2,
  };
}

module.exports = {
  startGame,
  hit,
  stand,
  double,
  split,
  getActiveGame,
  getHistory,
};
