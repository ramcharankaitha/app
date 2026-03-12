const fs = require('fs');
const dir = 'd:/projects/app/src/components/';

const files = [
  'AddChitCustomer.jsx','AddChitPlan.jsx','AddCustomer.jsx','AddDispatch.jsx',
  'AddPayment.jsx','AddProduct.jsx','AddProductPricing.jsx','AddSalesOrder.jsx',
  'AddSalesRecord.jsx','AddService.jsx','AddSupplier.jsx','AddTransport.jsx',
  'CategoryMaster.jsx','ChitEntryMaster.jsx','ChitPlanList.jsx','ChitPlanMaster.jsx',
  'ChitPlans.jsx','CreateSupplierTransaction.jsx','DispatchDepartment.jsx',
  'EditProfile.jsx','Handler.jsx','PaymentMaster.jsx','ProductList.jsx',
  'Profile.jsx','QuotationMaster.jsx','SalesOrder.jsx','Services.jsx',
  'Settings.jsx','StockInMaster.jsx','StockOutMaster.jsx',
  'SupplierTransactionMaster.jsx','TransactionProducts.jsx','TransportMaster.jsx'
];

files.forEach(f => {
  try {
    let c = fs.readFileSync(dir + f, 'utf8');
    const original = c;
    
    // Fix files that start with <div className="dashboard-container"> but end with </>
    if (c.includes('<div className="dashboard-container">') && c.includes('</>')) {
      // Replace the final </> with </div>
      c = c.replace(/<\/>(\s*)\);\s*$/, '</div>$1);\n');
      console.log(f + ': Fixed fragment closing to div closing');
    }
    
    // Fix files that have </> but need </div></>
    else if (c.includes('</>') && !c.includes('<div className="dashboard-container">')) {
      // Look for pattern where we have dashboard-main closing but missing container closing
      const mainClosePattern = /<\/div>(\s*)<\/>(\s*)\);\s*$/;
      if (mainClosePattern.test(c)) {
        c = c.replace(mainClosePattern, '</div></div>$1</>$2);\n');
        console.log(f + ': Added missing container div before fragment');
      }
    }
    
    // Fix files with missing closing divs - add them before the final </>
    const lines = c.split('\n');
    let needsFix = false;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('</>')) {
        // Check if there's a container div that needs closing
        let hasContainer = false;
        for (let j = 0; j < i; j++) {
          if (lines[j].includes('dashboard-container')) {
            hasContainer = true;
            break;
          }
        }
        
        if (hasContainer && i > 0) {
          // Insert </div> before </>
          lines.splice(i, 0, '      </div>');
          c = lines.join('\n');
          needsFix = true;
          console.log(f + ': Added missing container div closing');
        }
        break;
      }
    }
    
    if (c !== original) {
      fs.writeFileSync(dir + f, c, 'utf8');
      console.log(f + ': Updated');
    } else {
      console.log(f + ': No changes needed');
    }
  } catch(e) {
    console.log(f + ': ERROR - ' + e.message);
  }
});
