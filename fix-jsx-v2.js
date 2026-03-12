const fs = require('fs');
const dir = 'd:/projects/app/src/components/';

// Pattern A: Missing </div> for form-actions before </form>
// Also need to clean up stray </div> or <div> from previous fix attempts
const patternA = {
  'AddChitCustomer.jsx': 364,
  'AddChitPlan.jsx': 184,
  'AddCustomer.jsx': 465,
  'AddDispatch.jsx': 1206,
  'AddPayment.jsx': 331,
  'AddProduct.jsx': 865,
  'AddProductPricing.jsx': 517,
  'AddSalesOrder.jsx': 858,
  'AddService.jsx': 786,
  'AddSupplier.jsx': 346,
  'AddTransport.jsx': 531,
  'CreateSupplierTransaction.jsx': 631,
  'ProductList.jsx': 378,
  'Profile.jsx': 148,
};

// Pattern B: Extra </div> at error line - just remove it
const patternB = {
  'CategoryMaster.jsx': 459,
  'ChitEntryMaster.jsx': 478,
  'ChitPlanList.jsx': 366,
  'ChitPlanMaster.jsx': 391,
  'ChitPlans.jsx': 360,
  'DispatchDepartment.jsx': 489,
  'EditProfile.jsx': 526,
  'PaymentMaster.jsx': 518,
  'QuotationMaster.jsx': 735,
  'SalesOrder.jsx': 513,
  'Services.jsx': 535,
  'StockInMaster.jsx': 409,
  'StockOutMaster.jsx': 482,
  'SupplierTransactionMaster.jsx': 237,
  'TransactionProducts.jsx': 347,
  'TransportMaster.jsx': 663,
};

// Fix Pattern A files
Object.entries(patternA).forEach(([file, errorLine]) => {
  const filePath = dir + file;
  let lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const idx = errorLine - 1; // 0-indexed

  // Verify the error line contains </form>
  if (!lines[idx].trim().startsWith('</form>')) {
    console.log(file + ': SKIP - line ' + errorLine + ' is "' + lines[idx].trim() + '" not </form>');
    return;
  }

  // Get indentation of </form> and add 2 spaces for the </div>
  const formIndent = lines[idx].match(/^(\s*)/)[1];
  const divClose = formIndent + '  </div>';

  // Insert </div> before </form>
  lines.splice(idx, 0, divClose);
  console.log(file + ': Inserted </div> before </form> at line ' + errorLine);

  // Now scan forward from after </main> and first </div> (container close)
  // idx = new </div> (form-actions close)
  // idx+1 = </form>
  // idx+2 = </main>
  // idx+3 = </div> (container close) - KEEP
  // idx+4+ = remove stray </div> or <div> lines
  let scanFrom = idx + 4;
  let removedCount = 0;
  while (scanFrom < lines.length) {
    const trimmed = lines[scanFrom].trim();
    if (trimmed === '</div>' || trimmed === '<div>') {
      console.log(file + ': Removed stray "' + trimmed + '" at line ' + (scanFrom + 1));
      lines.splice(scanFrom, 1);
      removedCount++;
    } else {
      break;
    }
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(file + ': Done (removed ' + removedCount + ' stray tags)\n');
});

// Fix Pattern B files
Object.entries(patternB).forEach(([file, errorLine]) => {
  const filePath = dir + file;
  let lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const idx = errorLine - 1;

  if (!lines[idx].trim().startsWith('</div>')) {
    console.log(file + ': SKIP - line ' + errorLine + ' is "' + lines[idx].trim() + '" not </div>');
    return;
  }

  lines.splice(idx, 1);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(file + ': Removed extra </div> at line ' + errorLine);
});

// Fix Handler.jsx - missing }; before export default
{
  const filePath = dir + 'Handler.jsx';
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('  );\n\nexport default Handler;')) {
    content = content.replace(
      '  );\n\nexport default Handler;',
      '  );\n};\n\nexport default Handler;'
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('\nHandler.jsx: Added missing };');
  } else {
    console.log('\nHandler.jsx: Pattern not found, checking...');
    console.log(content.substring(content.indexOf('export default') - 30));
  }
}

console.log('\n=== All fixes applied! ===');
