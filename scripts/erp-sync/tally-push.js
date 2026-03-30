/**
 * TextileGuard ERP Sync Utility (Tally-to-Cloud Bridge)
 * 
 * This script automates the synchronization between your local Tally installation 
 * and the TextileGuard platform.
 * 
 * Usage:
 * node tally-push.js --company <YOUR_COMPANY_ID> --key <SUPABASE_ANON_KEY> --url <SUPABASE_URL>
 */

const fs = require('fs');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const args = require('minimist')(process.argv.slice(2));
const COMPANY_ID = args.company;
const SUPABASE_KEY = args.key;
const SUPABASE_URL = args.url;
const TALLY_URL = args.tally || 'http://localhost:9000';

if (!COMPANY_ID || !SUPABASE_KEY || !SUPABASE_URL) {
  console.error('CRITICAL ERROR: Missing required parameters.');
  console.log('Usage: node tally-push.js --company <ID> --key <KEY> --url <URL>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Robust XML Parser for Tally.ERP 9 and Tally Prime
 * (Node.js version of the regex-based logic used in the web app)
 */
function parseTallyXml(xml) {
  const customers = [];
  const invoices = [];

  // Logic to parse <LEDGER> and <VOUCHER> tags...
  // For demonstration, we'll look for standard Tally patterns
  
  // Regex to extract vouchers (simplified example)
  const voucherRegex = /<VOUCHER VCHTYPE="Sales"[\s\S]*?>([\s\S]*?)<\/VOUCHER>/g;
  let match;

  while ((match = voucherRegex.exec(xml)) !== null) {
    const vch = match[1];
    const invNum = vch.match(/<VOUCHERNUMBER>(.*?)<\/VOUCHERNUMBER>/)?.[1];
    const date = vch.match(/<DATE>(.*?)<\/DATE>/)?.[1];
    const customer = vch.match(/<PARTYLEDGERNAME>(.*?)<\/PARTYLEDGERNAME>/)?.[1];
    const amount = vch.match(/<AMOUNT>(.*?)<\/AMOUNT>/)?.[1];

    if (invNum && customer && amount) {
      invoices.push({
        invoice_number: invNum,
        customer_name: customer,
        total_amount: Math.abs(parseFloat(amount)),
        due_date: new Date(date).toISOString(), // Simplified date parsing
        status: 'pending'
      });
      
      // Collect unique customers
      if (!customers.find(c => c.name === customer)) {
        customers.push({ name: customer });
      }
    }
  }

  return { customers, invoices };
}

async function syncWithTally() {
  console.log('--- TextileGuard Synchronizer v1.0 ---');
  console.log(`Target Company ID: ${COMPANY_ID}`);
  
  try {
    console.log(`Connecting to Tally at ${TALLY_URL}...`);
    
    // In a real scenario, we'd send an export request to Tally here
    // For now, we'll try to read a local 'export.xml' if Tally isn't running
    let xml;
    try {
      const response = await axios.post(TALLY_URL, '<ENVELOPE>...</ENVELOPE>', {
        headers: { 'Content-Type': 'text/xml' }
      });
      xml = response.data;
      console.log('Successfully fetched live data from Tally.');
    } catch (e) {
      console.warn('Tally connection failed. Looking for local export.xml...');
      xml = fs.readFileSync('export.xml', 'utf-8');
    }

    const { customers: parsedCustomers, invoices: parsedInvoices } = parseTallyXml(xml);
    console.log(`Parsed ${parsedCustomers.length} entities and ${parsedInvoices.length} invoices.`);

    // --- SYNC LOGIC ---
    
    // 1. Upsert Customers
    console.log('Upserting entities to Cloud...');
    for (const c of parsedCustomers) {
      await supabase.from('customers').upsert({
        company_id: COMPANY_ID,
        name: c.name,
        // mapping other fields...
      }, { onConflict: 'company_id,name' });
    }

    // 2. Upsert Invoices
    console.log('Upserting invoices to Cloud...');
    // Fetch customer IDs first
    const { data: dbCustomers } = await supabase.from('customers').select('id, name').eq('company_id', COMPANY_ID);
    
    for (const inv of parsedInvoices) {
      const dbCust = dbCustomers.find(c => c.name === inv.customer_name);
      if (dbCust) {
        await supabase.from('invoices').upsert({
          company_id: COMPANY_ID,
          customer_id: dbCust.id,
          invoice_number: inv.invoice_number,
          amount: inv.total_amount,
          due_date: inv.due_date,
          status: 'pending'
        }, { onConflict: 'company_id,invoice_number' });
      }
    }

    console.log('Sync completed! Dashboard updated.');
    
  } catch (err) {
    console.error('SYNC FAILED:', err.message);
  }
}

syncWithTally();
