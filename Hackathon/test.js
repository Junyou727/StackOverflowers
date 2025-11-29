// ==============================
// CONFIG
// ==============================
const WEBHOOK_URL = "https://zxjm2505.app.n8n.cloud/webhook/as";

// ==============================
// FORM REFERENCES
// ==============================
const solarForm = document.getElementById("solarPlanningForm");
const energyForm = document.getElementById("energySellingForm");

// Output boxes
const feature1Output = document.querySelector('#feature1 .output-box');
const feature2Output = document.querySelector('#feature2 .output-box');

// ==============================
// GENERIC SEND FUNCTION
// ==============================
async function sendToWebhook(payload, outputBox, webhookUrl = WEBHOOK_URL) {
    outputBox.innerHTML = "<em>Sending...</em>";

    try {
        const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        
        // Debug: Log the full response
        console.log("Full API Response:", json);

        let analysis, recommendation;

        // Helper function to clean and parse response text
        function cleanAndParse(text) {
            if (!text) return null;
            
            // Remove markdown code blocks
            let cleaned = text.trim();
            cleaned = cleaned.replace(/^```json\s*/i, '');
            cleaned = cleaned.replace(/^```\s*/i, '');
            cleaned = cleaned.replace(/\s*```$/i, '');
            cleaned = cleaned.trim();
            
            try {
                return JSON.parse(cleaned);
            } catch (e) {
                console.error("Parse error:", e);
                return null;
            }
        }

        // Try to extract analysis and recommendation from various response formats
        if (json.output) {
            // Case 1: Wrapped in 'output' object
            const output = json.output;
            
            if (typeof output === 'string') {
                const parsed = cleanAndParse(output);
                if (parsed && parsed.analysis && parsed.recommendation) {
                    analysis = parsed.analysis;
                    recommendation = parsed.recommendation;
                } else {
                    analysis = output;
                    recommendation = "Could not parse recommendation";
                }
            } else if (typeof output === 'object') {
                analysis = output.analysis;
                recommendation = output.recommendation;
            }
        } else if (json.analysis && json.recommendation) {
            // Case 2: Direct properties at root level (but might be strings with markdown)
            if (typeof json.analysis === 'string' && json.analysis.includes('```')) {
                // Analysis contains markdown, parse it
                const parsed = cleanAndParse(json.analysis);
                if (parsed && parsed.analysis && parsed.recommendation) {
                    analysis = parsed.analysis;
                    recommendation = parsed.recommendation;
                } else {
                    analysis = json.analysis;
                    recommendation = json.recommendation;
                }
            } else {
                analysis = json.analysis;
                recommendation = json.recommendation;
            }
        } else if (json.candidates && json.candidates[0]?.content?.parts) {
            // Case 3: Gemini API direct response format
            const content = json.candidates[0].content.parts[0].text;
            const parsed = cleanAndParse(content);
            if (parsed && parsed.analysis && parsed.recommendation) {
                analysis = parsed.analysis;
                recommendation = parsed.recommendation;
            } else {
                analysis = content;
                recommendation = "See analysis above";
            }
        } else if (typeof json === 'string') {
            // Case 4: Entire response is a JSON string
            const parsed = cleanAndParse(json);
            if (parsed && parsed.analysis && parsed.recommendation) {
                analysis = parsed.analysis;
                recommendation = parsed.recommendation;
            } else {
                analysis = json;
                recommendation = "Could not parse response";
            }
        } else {
            // Fallback: Show raw response for debugging
            console.warn("Unexpected response format:", json);
            outputBox.innerHTML = `
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; color: #856404;">
                    <h3 style="color: #856404;">⚠️ Debug Mode - Response Received</h3>
                    <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; max-height: 400px; color: #333;">${JSON.stringify(json, null, 2)}</pre>
                    <p><em>The response format is unexpected. Check the console and your n8n workflow.</em></p>
                </div>
            `;
            return;
        }

        // Check if we successfully extracted both fields
        if (!analysis || !recommendation) {
            console.warn("Missing analysis or recommendation:", { analysis, recommendation });
            outputBox.innerHTML = `
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; color: #856404;">
                    <h3 style="color: #856404; margin-top: 0;">⚠️ Incomplete Response</h3>
                    ${analysis ? `<p><strong>Analysis:</strong> ${analysis}</p>` : '<p><em>No analysis received</em></p>'}
                    ${recommendation ? `<p><strong>Recommendation:</strong> ${recommendation}</p>` : '<p><em>No recommendation received</em></p>'}
                    <br>
                    <p style="margin-bottom: 0;"><em>Check your n8n workflow to ensure both 'analysis' and 'recommendation' fields are being returned.</em></p>
                </div>
            `;
            return;
        }

        // Display successful results with proper text color
        let html = `
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin-bottom: 15px; color: #155724;">
                <h3 style="margin-top: 0; color: #155724;">📊 AI Analysis</h3>
                <p style="margin-bottom: 0; line-height: 1.6; color: #155724;">${analysis}</p>
            </div>
            <div style="background: #d1ecf1; padding: 15px; border-radius: 5px; border-left: 4px solid #17a2b8; color: #0c5460;">
                <h3 style="margin-top: 0; color: #0c5460;">💡 AI Recommendation</h3>
                <p style="margin-bottom: 0; line-height: 1.6; color: #0c5460;">${recommendation}</p>
            </div>
        `;

        outputBox.innerHTML = html;

    } catch (err) {
        console.error("Error details:", err);
        outputBox.innerHTML = `
            <div style="background: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545; color: #721c24;">
                <h3 style="margin-top: 0; color: #721c24;">❌ Error</h3>
                <p style="color: #721c24;"><strong>${err.message}</strong></p>
                <p style="margin-bottom: 0; color: #721c24;"><em>Check the browser console for more details</em></p>
            </div>
        `;
    }
}

// ==============================
// FEATURE 1 — SOLAR PLANNING
// ==============================
if (solarForm) {
    solarForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fd = new FormData(solarForm);

        const data = {
            Building_Name: fd.get("building_name"),
            Location: fd.get("location"),
            Roof_Area_m2: Number(fd.get("roof_area_m2")),
            Roof_Orientation: fd.get("roof_orientation"),
            Monthly_Consumption_kWh: Number(fd.get("monthly_consumption_kwh")),
            Installation_Cost: Number(fd.get("installation_cost")),
        };

        console.log("Sending solar data:", data);
        await sendToWebhook(data, feature1Output, WEBHOOK_URL);
    });
}

// ==============================
// HARDCODED ENERGY SELLING CALCULATION
// ==============================
function calculateEnergySelling(data) {
    const { battery_capacity, panel_capacity, sell_rate, avg_usage, gov_incentive } = data;
    
    // Constants for calculations
    const DAYS_PER_MONTH = 30;
    const DAYS_PER_YEAR = 365;
    const AVG_SUNLIGHT_HOURS = 5; // Average peak sunlight hours in Malaysia
    
    // Calculate daily energy production (kWh/day)
    const dailyProduction = panel_capacity * AVG_SUNLIGHT_HOURS;
    
    // Calculate excess energy available for selling
    const dailyExcess = Math.max(0, dailyProduction - avg_usage);
    const monthlyExcess = dailyExcess * DAYS_PER_MONTH;
    const yearlyExcess = dailyExcess * DAYS_PER_YEAR;
    
    // Calculate revenue from selling excess energy
    const monthlyRevenue = monthlyExcess * sell_rate;
    const yearlyRevenue = yearlyExcess * sell_rate;
    
    // Calculate self-consumption savings
    const selfConsumption = Math.min(dailyProduction, avg_usage);
    const monthlySelfConsumptionSavings = selfConsumption * DAYS_PER_MONTH * sell_rate;
    const yearlySelfConsumptionSavings = selfConsumption * DAYS_PER_YEAR * sell_rate;
    
    // Total benefits
    const totalMonthlyBenefit = monthlyRevenue + monthlySelfConsumptionSavings + ((gov_incentive || 0) / 12);
    const totalYearlyBenefit = yearlyRevenue + yearlySelfConsumptionSavings + (gov_incentive || 0);
    
    // Calculate battery utilization
    const batteryDays = battery_capacity > 0 ? (battery_capacity / avg_usage).toFixed(1) : 'N/A';
    
    // Payback analysis
    const estimatedInstallationCost = panel_capacity * 4000;
    const paybackYears = totalYearlyBenefit > 0 ? (estimatedInstallationCost / totalYearlyBenefit).toFixed(1) : 'N/A';
    
    return {
        dailyProduction: dailyProduction.toFixed(2),
        dailyExcess: dailyExcess.toFixed(2),
        monthlyExcess: monthlyExcess.toFixed(2),
        yearlyExcess: yearlyExcess.toFixed(2),
        monthlyRevenue: monthlyRevenue.toFixed(2),
        yearlyRevenue: yearlyRevenue.toFixed(2),
        monthlySelfConsumption: monthlySelfConsumptionSavings.toFixed(2),
        yearlySelfConsumption: yearlySelfConsumptionSavings.toFixed(2),
        totalMonthlyBenefit: totalMonthlyBenefit.toFixed(2),
        totalYearlyBenefit: totalYearlyBenefit.toFixed(2),
        batteryDays: batteryDays,
        estimatedCost: estimatedInstallationCost.toFixed(2),
        paybackYears: paybackYears
    };
}

// ==============================
// FEATURE 2 — ENERGY SELLING
// ==============================
if (energyForm) {
    energyForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fd = new FormData(energyForm);

        const data = {
            battery_capacity: Number(fd.get("battery_capacity") || 0),
            panel_capacity: Number(fd.get("panel_capacity") || 0),
            sell_rate: Number(fd.get("sell_rate") || 0),
            avg_usage: Number(fd.get("avg_usage") || 0),
            gov_incentive: Number(fd.get("gov_incentive") || 0),
        };

        console.log("Calculating energy selling data:", data);
        
        // Show loading state
        feature2Output.innerHTML = "<em>Calculating...</em>";
        
        // Validate inputs
        if (!data.panel_capacity || !data.sell_rate || !data.avg_usage) {
            feature2Output.innerHTML = `
                <div style="background: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545; color: #721c24;">
                    <h3 style="margin-top: 0; color: #721c24;">❌ Missing Required Fields</h3>
                    <p style="color: #721c24;">Please fill in Panel Capacity, Sell-back Rate, and Average Usage.</p>
                </div>
            `;
            return;
        }
        
        // Calculate results using hardcoded function
        const result = calculateEnergySelling(data);
        
        // Display results in a clean table format
        let html = `
            <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 2px solid #28a745; color: #333;">
                <h3 style="margin-top: 0; color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">⚡ Energy Calculation Results</h3>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold;">Daily Production</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right;">${result.dailyProduction} kWh</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold;">Daily Excess (Sellable)</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right; color: ${parseFloat(result.dailyExcess) > 0 ? '#28a745' : '#dc3545'}; font-weight: bold;">${result.dailyExcess} kWh</td>
                    </tr>
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold;">Monthly Excess</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right;">${result.monthlyExcess} kWh</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold;">Yearly Excess</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right;">${result.yearlyExcess} kWh</td>
                    </tr>
                    <tr style="background: #e7f5ff;">
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #0c5460;">💰 Monthly Revenue (Excess Sales)</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right; color: #0c5460; font-weight: bold;">RM ${result.monthlyRevenue}</td>
                    </tr>
                    <tr style="background: #e7f5ff;">
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #0c5460;">💰 Yearly Revenue (Excess Sales)</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right; color: #0c5460; font-weight: bold;">RM ${result.yearlyRevenue}</td>
                    </tr>
                    <tr style="background: #d4edda;">
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #155724;">💡 Monthly Self-Consumption Savings</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right; color: #155724; font-weight: bold;">RM ${result.monthlySelfConsumption}</td>
                    </tr>
                    <tr style="background: #d4edda;">
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #155724;">💡 Yearly Self-Consumption Savings</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right; color: #155724; font-weight: bold;">RM ${result.yearlySelfConsumption}</td>
                    </tr>
                    <tr style="background: #fff3cd;">
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #856404;">🎯 Total Monthly Benefit</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right; color: #856404; font-weight: bold; font-size: 1.1em;">RM ${result.totalMonthlyBenefit}</td>
                    </tr>
                    <tr style="background: #fff3cd;">
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #856404;">🎯 Total Yearly Benefit</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right; color: #856404; font-weight: bold; font-size: 1.1em;">RM ${result.totalYearlyBenefit}</td>
                    </tr>
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold;">🔋 Battery Backup Duration</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right;">${result.batteryDays} days</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold;">Estimated Installation Cost</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right;">RM ${result.estimatedCost}</td>
                    </tr>
                    <tr style="background: #d1ecf1;">
                        <td style="padding: 12px; font-weight: bold; color: #0c5460;">⏱️ Payback Period</td>
                        <td style="padding: 12px; text-align: right; color: #0c5460; font-weight: bold; font-size: 1.1em;">${result.paybackYears} years</td>
                    </tr>
                </table>
            </div>
        `;
        
        feature2Output.innerHTML = html;
    });
}

// ==============================
// FEATURE 3 — PREDICTION MODEL
// ==============================
document.getElementById("predict-form").addEventListener("submit", (e) => {
    e.preventDefault();  // prevent form from refreshing
    console.log("Button clicked!");  // <-- check if this runs
});

document.getElementById("predict-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const state = document.getElementById("state").value;
    const sunlight = 4.5;
    const panel_area_val = parseFloat(document.getElementById('panel_area').value);
    const panel_efficiency_val = parseFloat(document.getElementById('panel_efficiency').value) / 100; // convert % to decimal
    const earn_rate_val = parseFloat(document.getElementById('earn_rate').value);

    // Backend automatically calculates next month
    const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state })
    });

    const data = await response.json();
    const next_month_days = data.days_in_next_month;

    // kWh/day
    const daily_calc = panel_area_val * panel_efficiency_val * sunlight;
    // kWh/month
    const monthly_calc = daily_calc * next_month_days;
    // RM
    const monthly_income = monthly_calc * earn_rate_val;

    document.getElementById("result").innerText =
    `
    Predicted rainy days next month: ${data.predicted_rainy_days}
    Estimated monthly solar energy: ${monthly_calc.toFixed(2)} kWh
    Estimated income: RM ${monthly_income.toFixed(2)}
    `;
});