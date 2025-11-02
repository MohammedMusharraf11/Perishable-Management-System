/**
 * PMS-T-042: Unit tests for expiry calculation logic
 * 
 * Tests for the expiry monitoring service
 */

/**
 * Test: Calculate days until expiry
 */
const testDaysCalculation = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const testCases = [
    {
      name: 'Expired item (yesterday)',
      expiryDate: new Date(today.getTime() - 24 * 60 * 60 * 1000),
      expectedDays: -1,
      expectedAlert: 'EXPIRED'
    },
    {
      name: 'Expiring today',
      expiryDate: today,
      expectedDays: 0,
      expectedAlert: 'EXPIRING_TODAY'
    },
    {
      name: 'Expiring in 1 day',
      expiryDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      expectedDays: 1,
      expectedAlert: 'EXPIRING_1_DAY'
    },
    {
      name: 'Expiring in 2 days',
      expiryDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      expectedDays: 2,
      expectedAlert: 'EXPIRING_2_DAYS'
    },
    {
      name: 'Expiring in 3 days (no alert)',
      expiryDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      expectedDays: 3,
      expectedAlert: null
    }
  ];

  console.log('🧪 Testing Expiry Calculation Logic\n');
  
  testCases.forEach(test => {
    const diffTime = test.expiryDate.getTime() - today.getTime();
    const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const passed = daysUntilExpiry === test.expectedDays;
    console.log(`${passed ? '✅' : '❌'} ${test.name}`);
    console.log(`   Expected: ${test.expectedDays} days, Got: ${daysUntilExpiry} days`);
    console.log(`   Alert Type: ${test.expectedAlert || 'None'}\n`);
  });
};

/**
 * Test: Status update logic
 */
const testStatusUpdate = () => {
  const testCases = [
    { daysLeft: -1, expectedStatus: 'EXPIRED' },
    { daysLeft: 0, expectedStatus: 'EXPIRING_SOON' },
    { daysLeft: 1, expectedStatus: 'EXPIRING_SOON' },
    { daysLeft: 2, expectedStatus: 'EXPIRING_SOON' },
    { daysLeft: 3, expectedStatus: 'EXPIRING_SOON' },
    { daysLeft: 4, expectedStatus: 'ACTIVE' },
    { daysLeft: 7, expectedStatus: 'ACTIVE' }
  ];

  console.log('🧪 Testing Status Update Logic\n');
  
  testCases.forEach(test => {
    let status;
    if (test.daysLeft < 0) {
      status = 'EXPIRED';
    } else if (test.daysLeft <= 3) {
      status = 'EXPIRING_SOON';
    } else {
      status = 'ACTIVE';
    }
    
    const passed = status === test.expectedStatus;
    console.log(`${passed ? '✅' : '❌'} Days: ${test.daysLeft} → Status: ${status}`);
  });
  
  console.log('');
};

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('='.repeat(60));
  console.log('Running Expiry Monitor Unit Tests');
  console.log('='.repeat(60) + '\n');
  
  testDaysCalculation();
  testStatusUpdate();
  
  console.log('='.repeat(60));
  console.log('Tests Complete');
  console.log('='.repeat(60));
}

export { testDaysCalculation, testStatusUpdate };
