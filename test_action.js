const result = { type: 'success', status: 200, data: { success: true, data: { trxNumber: 'TRX-123', totalAmount: 10000, changeAmount: 5000 } } };
console.log(result.data.trxNumber); // undefined
console.log(result.data.data.trxNumber); // TRX-123
