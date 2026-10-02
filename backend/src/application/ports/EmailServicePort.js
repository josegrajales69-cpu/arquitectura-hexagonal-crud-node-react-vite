/** Outbound port for order email notifications. The application knows no mail vendor. */
export class EmailServicePort {
  async sendOrderConfirmation(_message) {
    throw new Error('Implement sendOrderConfirmation()');
  }

  async sendAdminOrderNotification(_message) {
    throw new Error('Implement sendAdminOrderNotification()');
  }
}
