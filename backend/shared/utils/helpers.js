function apiSuccessResponse(data, message = 'OK') {
  return { success: true, message, data };
}

function apiErrorResponse(message, errors = null) {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return response;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
  }).format(parseFloat(amount));
}

module.exports = { apiSuccessResponse, apiErrorResponse, formatCurrency };
