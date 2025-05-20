
const smsService = {
  sendSMS: async (phoneNumber, message) => {
    // In a real application, this would call an SMS API
    console.log('----------------------');
    console.log('MOCK SMS SENT:');
    console.log(`To: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log('----------------------');
    
    return true;
  }
};

module.exports = smsService;