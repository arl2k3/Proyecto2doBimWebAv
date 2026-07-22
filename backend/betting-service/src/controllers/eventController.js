const eventService = require('../services/eventService');

async function selectAll(req, res, next) {
  try {
    const { status } = req.query;
    const events = await eventService.getAllEvents({ status });
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
}

async function selectById(req, res, next) {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
}

async function store(req, res, next) {
  try {
    const { title, eventDate, oddsHome, oddsAway, oddsDraw } = req.body;
    const newEvent = await eventService.createEvent({
      title,
      eventDate,
      oddsHome,
      oddsAway,
      oddsDraw,
    });

    res.status(201).json({
      success: true,
      message: 'Evento deportivo creado exitosamente.',
      data: newEvent,
    });
  } catch (error) {
    next(error);
  }
}

async function resolve(req, res, next) {
  try {
    const { winner } = req.body;
    const solvedEvent = await eventService.resolveEvent(req.params.id, winner);

    res.status(200).json({
      success: true,
      message: `El evento ha sido finalizado. Ganador: ${winner}. Apuestas liquidadas.`,
      data: solvedEvent,
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const { title, eventDate, oddsHome, oddsAway, oddsDraw } = req.body;
    const updatedEvent = await eventService.updateEvent(req.params.id, {
      title,
      eventDate,
      oddsHome,
      oddsAway,
      oddsDraw,
    });

    res.status(200).json({
      success: true,
      message: 'Evento deportivo actualizado exitosamente.',
      data: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
}

async function destroy(req, res, next) {
  try {
    await eventService.deleteEvent(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Evento deportivo eliminado exitosamente.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  selectAll,
  selectById,
  store,
  resolve,
  update,
  destroy,
};
