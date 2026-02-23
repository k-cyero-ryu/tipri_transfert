// First login to get token
const loginRes = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});

const loginData = await loginRes.json();
console.log('Login response:', loginData);

if (loginData.token) {
  // Test accounts endpoint
  const accountsRes = await fetch('http://localhost:3001/api/accounts', {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    }
  });
  
  const accountsData = await accountsRes.json();
  console.log('\nAccounts response status:', accountsRes.status);
  console.log('Accounts data:', JSON.stringify(accountsData, null, 2));
  
  // Test transactions endpoint
  const transactionsRes = await fetch('http://localhost:3001/api/transactions', {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    }
  });
  
  const transactionsData = await transactionsRes.json();
  console.log('\nTransactions response status:', transactionsRes.status);
  console.log('Transactions data:', JSON.stringify(transactionsData, null, 2));
}
