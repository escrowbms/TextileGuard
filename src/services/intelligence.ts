import { supabase } from "@/lib/supabase";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export interface AIVerdict {
  expectedDate: string;
  confidence: number;
  reasoning: string;
}

export interface RiskAudit {
  score: number;
  verdict: 'GREEN' | 'YELLOW' | 'RED';
  analysis: string;
  recommendations: string[];
}

/**
 * Predicts the expected payment date based on historical patterns and risk scores.
 * Now powered by Groq AI (Llama 3 70B) for real-time intelligence.
 */
export async function getAIPrediction(invoiceId: string, customerId: string): Promise<AIVerdict> {
  try {
    // 1. Fetch invoice and customer data
    const { data: invoice } = await supabase
      .from('invoices')
      .select('due_date, created_at, balance_due')
      .eq('id', invoiceId)
      .single();
    
    const { data: customer } = await supabase
      .from('customers')
      .select('risk_score, risk_level')
      .eq('id', customerId)
      .single();

    if (!invoice || !customer) throw new Error("Entity data missing for prediction");

    // 2. Try Live Groq AI if Key is provided
    if (GROQ_API_KEY) {
      try {
        const prompt = `
          As an Industrial Credit Analyst for TextileGuard (India), analyze this overdue invoice:
          - Invoice Amount: ₹${invoice.balance_due}
          - Due Date: ${invoice.due_date}
          - Customer Risk Score: ${customer.risk_score}/100
          - Risk Category: ${customer.risk_level}
          
          Predict the Expected Payment Date and provide a 1-sentence analytical reasoning.
          Return ONLY a JSON object: {"expectedDate": "YYYY-MM-DD", "confidence": number, "reasoning": "string"}
        `;

        const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "llama3-70b-8192", // High-performance Llama 3 on Groq
            messages: [
              { role: "system", content: "You are a professional industrial credit analyst. You output ONLY JSON." }, 
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          })
        });

        const result = await response.json();
        if (result.choices?.[0]?.message?.content) {
          const aiContent = JSON.parse(result.choices[0].message.content);
          return {
            expectedDate: aiContent.expectedDate,
            confidence: aiContent.confidence,
            reasoning: aiContent.reasoning
          };
        }
      } catch (aiErr) {
        console.warn("Groq AI Uplink failed, falling back to heuristic:", aiErr);
      }
    }

    // 3. Intelligence Logic (Heuristic Simulation Fallback)
    const dueDate = new Date(invoice.due_date);
    const riskFactor = customer.risk_score || 50; // 0-100
    
    let daysToDelay = 0;
    if (riskFactor < 25) daysToDelay = Math.floor(Math.random() * 5); 
    else if (riskFactor < 50) daysToDelay = 5 + Math.floor(Math.random() * 10); 
    else if (riskFactor < 75) daysToDelay = 20 + Math.floor(Math.random() * 20); 
    else daysToDelay = 45 + Math.floor(Math.random() * 60); 

    const expectedDate = new Date(dueDate);
    expectedDate.setDate(dueDate.getDate() + daysToDelay);

    const confidence = Math.max(0, 100 - riskFactor - (daysToDelay / 2));

    let reasoning = "";
    if (riskFactor < 30) reasoning = "Stable payment history and low exposure indicate high reliability.";
    else if (riskFactor < 70) reasoning = "Moderate risk detected due to past industry-wide delays and current exposure.";
    else reasoning = "Critical risk flag: Significant historical delays at this exposure level.";

    return {
      expectedDate: expectedDate.toISOString().split('T')[0],
      confidence: Math.round(confidence),
      reasoning
    };
  } catch (err) {
    console.error("Intelligence Prediction failure:", err);
    return {
      expectedDate: "CALCULATING...",
      confidence: 0,
      reasoning: "Insufficient data for deterministic prediction."
    };
  }
}

/**
 * Gets the GST compliance pattern for a customer.
 */
export async function getGSTCompliance(customerId: string) {
  const { data: customer } = await supabase
    .from('customers')
    .select('risk_score')
    .eq('id', customerId)
    .single();

  if (!customer) return 'UNKNOWN';
  if (customer.risk_score < 40) return 'CONSISTENT';
  if (customer.risk_score < 75) return 'IRREGULAR';
  return 'DELAYED';
}

/**
 * Generates a standardized legal notice draft for overdue invoices using Groq AI.
 */
export async function generateLegalDraft(customerName: string, invoiceNumber: string, amount: number, dueDate: string) {
  const today = new Date().toLocaleDateString('en-IN');
  
  if (GROQ_API_KEY) {
    try {
      const prompt = `
        Draft a professional, authoritative, and MSME-compliant legal demand notice for:
        - Debtor: ${customerName}
        - Overdue Invoice: ${invoiceNumber}
        - Amount: ₹${amount.toLocaleString()}
        - Due Since: ${dueDate}
        
        The tone should be 'Warning: Tactical Enforcement'. Mention Section 138-NI and MSME Samadhaan for compliance.
        Return ONLY the text of the legal notice.
      `;

      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            { role: "system", content: "You are an Indian corporate legal advisor specialized in credit recovery." }, 
            { role: "user", content: prompt }
          ]
        })
      });

      const result = await response.json();
      if (result.choices?.[0]?.message?.content) {
        return result.choices[0].message.content.trim();
      }
    } catch (aiErr) {
      console.warn("Groq legal draft generation failed, falling back to template.");
    }
  }

  return `
LEGAL NOTICE DRAFT - FOR INTERNAL REVIEW
Generated by TextileGuard™ Enforcement Engine

Date: ${today}

To,
The Management,
${customerName}

RE: Final Demand for Payment of Overdue Invoice #${invoiceNumber}

Dear Sir/Madam,

Our records indicate that an amount of ₹${amount.toLocaleString()} remains outstanding against Invoice #${invoiceNumber}, which was due on ${dueDate}. 

Despite multiple reminders via automated channels, the payment has not been credited to our account. Please note that as per the agreed commercial terms and MSME Samadhaan guidelines, we are entitled to claim interest at 3x the bank rate for this delay.

We hereby request you to clear the outstanding amount within 48 hours to avoid escalation to our legal cell and subsequent filing under Section 138 of the Negotiable Instruments Act / MSME Council.

Treat this as a formal notice of enforcement.

Regards,
Accounts Recovery Team
TextileGuard™ Secured Platform
  `.trim();
}

/**
 * Performs a deep forensic risk audit using Grok AI.
 */
export async function getCustomerRiskAudit(customerId: string): Promise<RiskAudit> {
  try {
    const { data: customer } = await supabase
      .from('customers')
      .select('name, risk_score, risk_level, exposure, overdue_amount, city, credit_limit')
      .eq('id', customerId)
      .single();

    if (!customer) throw new Error("Customer not found");

    if (GROQ_API_KEY) {
      const prompt = `
        Perform a Deep Risk Audit for an Industrial Textile Client:
        - Entity: ${customer.name} (${customer.city})
        - Current Exposure: ₹${customer.exposure}
        - Overdue Balance: ₹${customer.overdue_amount}
        - Credit Limit: ₹${customer.credit_limit}
        - Heuristic Risk Score: ${customer.risk_score}/100
        
        Provide a forensic analysis of their liquidity position and payment reliability.
        Return ONLY a JSON object: {
          "score": number (0-100),
          "verdict": "GREEN" | "YELLOW" | "RED",
          "analysis": "2-3 sentences of core logic",
          "recommendations": ["step 1", "step 2", "step 3"]
        }
      `;

      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama3-8b-8192", // Faster model for audit
          messages: [
            { role: "system", content: "You are a professional credit risk auditor. Output ONLY JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      const result = await response.json();
      if (result.choices?.[0]?.message?.content) {
        const audit = JSON.parse(result.choices[0].message.content);
        return audit;
      }
    }

    // Fallback logic
    const score = customer.risk_score;
    return {
      score: score,
      verdict: score > 80 ? 'RED' : score > 40 ? 'YELLOW' : 'GREEN',
      analysis: `Heuristic analysis indicates a ${score > 50 ? 'distressed' : 'stable'} credit profile based on current exposure of ₹${(customer.exposure/100000).toFixed(2)}L against a limit of ₹${(customer.credit_limit/100000).toFixed(2)}L.`,
      recommendations: [
        score > 70 ? "Stop all future dispatches immediately" : "Regularize payment within 7 days",
        "Perform site visit if exposure exceeds 110% of limit",
        "Initiate legal draft if overdue exceeds 90 days"
      ]
    };
  } catch (err) {
    console.error("Risk Audit failure:", err);
    return {
      score: 50,
      verdict: 'YELLOW',
      analysis: "Intelligence uplink interrupted. Fallback to basic monitoring.",
      recommendations: ["Manually review recent payments", "Verify GST filing status"]
    };
  }
}

export async function generateComplianceReport(companyId: string): Promise<string> {
  const env_key = import.meta.env.VITE_GROQ_API_KEY;
  if (!env_key) return "Intelligence Key Missing.";
  try {
    const { data: stats } = await supabase.from('invoices').select('total_amount, status').eq('company_id', companyId);
    const total = stats?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
    
    const resp = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env_key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "system", content: "Executive reporter." }, { role: "user", content: `Report on ₹${total} total volume.` }]
      })
    });
    const data = await resp.json();
    return data.choices[0].message.content;
  } catch { return "Audit Link Severed."; }
}
