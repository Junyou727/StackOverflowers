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
async function sendToWebhook(payload, outputBox) {
    outputBox.innerHTML = "<em>Sending...</em>";

    try {
        const res = await fetch(WEBHOOK_URL, {
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
        await sendToWebhook(data, feature1Output);
    });
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

        console.log("Sending energy data:", data);
        await sendToWebhook(data, feature2Output);
    });
}