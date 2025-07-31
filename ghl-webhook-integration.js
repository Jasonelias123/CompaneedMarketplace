/**
 * GoHighLevel Webhook Integration Module
 * Works with trial accounts using webhook triggers
 * Integrates seamlessly with existing Firebase authentication flow
 */

console.log('GoHighLevel Webhook Integration Module Loading...');

/**
 * Check if GoHighLevel integration is enabled and configured
 */
export function isGHLIntegrationEnabled() {
    const enabled = window.GHL_INTEGRATION_ENABLED === "true";
    const hasWebhook = Boolean(window.GHL_WEBHOOK_URL);
    
    if (!enabled) {
        console.log('GoHighLevel integration is disabled');
        return false;
    }
    
    if (!hasWebhook) {
        console.error('GoHighLevel webhook URL is not configured');
        return false;
    }
    
    return true;
}

/**
 * Calculate lead score based on company information
 */
function calculateLeadScore(formData) {
    let score = 0;
    
    // Revenue scoring (higher revenue = higher score)
    const revenue = formData.get('annualRevenue');
    switch(revenue) {
        case '200M+':
            score += 100;
            break;
        case '50-200M':
            score += 75;
            break;
        case '5-50M':
            score += 50;
            break;
        case '0-5M':
            score += 25;
            break;
    }
    
    // Employee count scoring
    const employees = formData.get('employees');
    switch(employees) {
        case '200+':
            score += 50;
            break;
        case '50-200':
            score += 35;
            break;
        case '11-50':
            score += 20;
            break;
        case '0-10':
            score += 10;
            break;
    }
    
    // AI goals scoring (some goals indicate higher intent)
    const aiGoals = formData.get('aiGoals');
    if (aiGoals === 'All the above') {
        score += 30;
    } else if (aiGoals === 'Build custom AI products for my company') {
        score += 25;
    } else if (aiGoals === 'Automate Manual Process') {
        score += 20;
    } else if (aiGoals === 'Increase Lead Flow and Automate Sales Process') {
        score += 20;
    } else if (aiGoals === 'Im not sure, looking for your guidance') {
        score += 10;
    }
    
    // Pain points scoring
    const painPoints = formData.get('painPoints');
    if (painPoints === 'Not enough lead flow') {
        score += 15; // High intent for sales automation
    } else if (painPoints === 'Too many manual tasks') {
        score += 15; // High intent for automation
    } else if (painPoints === 'Lack of standardization and organization') {
        score += 10;
    }
    
    return Math.min(score, 200); // Cap at 200
}

/**
 * Generate appropriate tags based on company information
 */
function generateTags(formData, leadScore) {
    const tags = [];
    
    // Source tag
    tags.push('Website Lead');
    tags.push('Enhanced Form Signup');
    
    // Revenue-based tags
    const revenue = formData.get('annualRevenue');
    if (revenue) {
        tags.push(`Revenue: ${revenue}`);
        
        if (revenue === '200M+') {
            tags.push('Enterprise');
            tags.push('Hot Lead');
        } else if (revenue === '50-200M') {
            tags.push('Mid Market');
            tags.push('Qualified Lead');
        } else if (revenue === '5-50M') {
            tags.push('SMB');
        } else {
            tags.push('Startup');
        }
    }
    
    // Company size tags
    const employees = formData.get('employees');
    if (employees) {
        tags.push(`Size: ${employees}`);
        
        if (employees === '200+') {
            tags.push('Large Company');
        } else if (employees === '50-200') {
            tags.push('Medium Company');
        } else {
            tags.push('Small Company');
        }
    }
    
    // Industry tag
    const industry = formData.get('industry');
    if (industry) {
        tags.push(`Industry: ${industry}`);
    }
    
    // AI Goals tags
    const aiGoals = formData.get('aiGoals');
    if (aiGoals) {
        if (aiGoals === 'All the above') {
            tags.push('High AI Intent');
            tags.push('Multiple Use Cases');
        } else if (aiGoals === 'Build custom AI products for my company') {
            tags.push('Custom AI Development');
            tags.push('Technical');
        } else if (aiGoals.includes('Automate')) {
            tags.push('Automation Focus');
        } else if (aiGoals.includes('Lead Flow')) {
            tags.push('Sales Focus');
        } else if (aiGoals.includes('not sure')) {
            tags.push('Needs Guidance');
            tags.push('Education Needed');
        }
    }
    
    // Lead score tags
    if (leadScore >= 150) {
        tags.push('High Value Lead');
    } else if (leadScore >= 100) {
        tags.push('Medium Value Lead');
    } else {
        tags.push('Standard Lead');
    }
    
    return tags;
}

/**
 * Transform form data for GoHighLevel webhook
 */
function transformDataForGHL(formData, userEmail, firebaseUid, leadScore, tags) {
    const fullName = formData.get('fullName') || '';
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return {
        // Basic contact information
        firstName: firstName,
        lastName: lastName,
        email: userEmail,
        companyName: formData.get('companyName') || '',
        
        // Custom fields for business information
        customField: {
            annual_revenue: formData.get('annualRevenue') || '',
            number_of_employees: formData.get('employees') || '',
            industry: formData.get('industry') || '',
            ai_goals: formData.get('aiGoals') || '',
            pain_points: formData.get('painPoints') || '',
            lead_source: 'Website Enhanced Signup Form',
            form_version: 'enhanced-v1',
            firebase_uid: firebaseUid,
            lead_quality_score: leadScore,
            signup_date: new Date().toISOString()
        },
        
        // Tags for segmentation
        tags: tags,
        
        // Additional webhook metadata
        source: 'companeeds-website',
        webhook_version: '1.0',
        timestamp: new Date().toISOString()
    };
}

/**
 * Send contact data to GoHighLevel via webhook
 */
async function sendToGHLWebhook(contactData) {
    const webhookUrl = window.GHL_WEBHOOK_URL;
    
    console.log('Sending contact to GoHighLevel webhook:', webhookUrl);
    console.log('Contact data:', contactData);
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Companeeds-Integration/1.0'
            },
            body: JSON.stringify(contactData)
        });
        
        if (!response.ok) {
            throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.text();
        console.log('GoHighLevel webhook response:', responseData);
        
        return {
            success: true,
            response: responseData,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('GoHighLevel webhook error:', error);
        
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Main integration function - called from company signup
 */
export async function integrateWithGoHighLevel(formData, userEmail, firebaseUid) {
    console.log('=== STARTING GOHIGHLEVEL WEBHOOK INTEGRATION ===');
    
    // Check if integration is enabled
    if (!isGHLIntegrationEnabled()) {
        console.log('GoHighLevel integration skipped (disabled or not configured)');
        return {
            integrated: false,
            reason: 'Integration disabled or webhook not configured'
        };
    }
    
    try {
        console.log('Transforming form data for GoHighLevel...');
        
        // Calculate lead score
        const leadScore = calculateLeadScore(formData);
        console.log(`Calculated lead score: ${leadScore} for revenue: ${formData.get('annualRevenue')} employees: ${formData.get('employees')}`);
        
        // Generate tags
        const tags = generateTags(formData, leadScore);
        console.log('Generated tags:', tags);
        
        // Transform data for webhook
        const contactData = transformDataForGHL(formData, userEmail, firebaseUid, leadScore, tags);
        
        // Send to GoHighLevel
        console.log('Sending contact to GoHighLevel webhook...');
        const result = await sendToGHLWebhook(contactData);
        
        if (result.success) {
            console.log('GoHighLevel webhook integration successful!');
            console.log('=== GOHIGHLEVEL INTEGRATION COMPLETED ===');
            
            return {
                integrated: true,
                leadScore: leadScore,
                tags: tags,
                ghlResponse: result.response,
                timestamp: result.timestamp
            };
        } else {
            console.error('GoHighLevel webhook integration failed:', result.error);
            
            return {
                integrated: false,
                error: result.error,
                timestamp: result.timestamp
            };
        }
        
    } catch (error) {
        console.error('GoHighLevel integration error:', error);
        
        return {
            integrated: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Get integration status for debugging
 */
export function getGHLIntegrationStatus() {
    return {
        enabled: window.GHL_INTEGRATION_ENABLED === "true",
        webhookConfigured: Boolean(window.GHL_WEBHOOK_URL),
        webhookUrl: window.GHL_WEBHOOK_URL ? 'configured' : 'missing'
    };
}

console.log('GoHighLevel Webhook Integration Module Loaded Successfully');
console.log('Integration Status:', getGHLIntegrationStatus());
