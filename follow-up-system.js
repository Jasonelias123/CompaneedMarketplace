// Follow-up and Relationship Management System
// Tracks project outcomes and client satisfaction for continuous improvement

class FollowUpSystem {
    constructor() {
        this.emailService = new EmailService();
    }

    // Schedule follow-up emails after project completion
    async scheduleProjectFollowUp(matchId, companyEmail, consultantEmail, projectDetails) {
        try {
            // Create follow-up record
            const followUpData = {
                matchId: matchId,
                companyEmail: companyEmail,
                consultantEmail: consultantEmail,
                projectDetails: projectDetails,
                status: 'scheduled',
                scheduledFor: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 1 week from now
                createdAt: new Date(),
                completedAt: null,
                feedback: null
            };

            if (typeof firebase !== 'undefined' && firebase.firestore) {
                await firebase.firestore().collection('follow_ups').add(followUpData);
                console.log('Follow-up scheduled for match:', matchId);
            }

            return { success: true, message: 'Follow-up scheduled successfully' };
        } catch (error) {
            console.error('Error scheduling follow-up:', error);
            return { success: false, message: error.message };
        }
    }

    // Send follow-up emails for project feedback
    async sendProjectFollowUp(followUpId) {
        try {
            const doc = await firebase.firestore().collection('follow_ups').doc(followUpId).get();
            const followUpData = doc.data();

            if (!followUpData) {
                throw new Error('Follow-up record not found');
            }

            // Send follow-up to company
            await this.emailService.sendProjectFollowUp(
                followUpData.companyEmail,
                followUpData.projectDetails
            );

            // Send follow-up to consultant
            await this.emailService.sendProjectFollowUp(
                followUpData.consultantEmail,
                followUpData.projectDetails
            );

            // Update follow-up status
            await firebase.firestore().collection('follow_ups').doc(followUpId).update({
                status: 'sent',
                sentAt: new Date()
            });

            console.log('Follow-up emails sent for:', followUpId);
            return { success: true, message: 'Follow-up emails sent successfully' };

        } catch (error) {
            console.error('Error sending follow-up:', error);
            return { success: false, message: error.message };
        }
    }

    // Collect feedback from project participants
    async collectFeedback(followUpId, userType, feedbackData) {
        try {
            const updateData = {
                [`${userType}_feedback`]: {
                    rating: feedbackData.rating,
                    comments: feedbackData.comments,
                    wouldRecommend: feedbackData.wouldRecommend,
                    submittedAt: new Date()
                }
            };

            await firebase.firestore().collection('follow_ups').doc(followUpId).update(updateData);

            // Check if both parties have provided feedback
            const doc = await firebase.firestore().collection('follow_ups').doc(followUpId).get();
            const data = doc.data();

            if (data.company_feedback && data.consultant_feedback) {
                await this.completeFeedbackProcess(followUpId);
            }

            return { success: true, message: 'Feedback recorded successfully' };

        } catch (error) {
            console.error('Error collecting feedback:', error);
            return { success: false, message: error.message };
        }
    }

    // Complete the feedback process and analyze results
    async completeFeedbackProcess(followUpId) {
        try {
            await firebase.firestore().collection('follow_ups').doc(followUpId).update({
                status: 'completed',
                completedAt: new Date()
            });

            // Analyze feedback for insights
            await this.analyzeFeedback(followUpId);

            console.log('Feedback process completed for:', followUpId);

        } catch (error) {
            console.error('Error completing feedback process:', error);
        }
    }

    // Analyze feedback to improve matching algorithm
    async analyzeFeedback(followUpId) {
        try {
            const doc = await firebase.firestore().collection('follow_ups').doc(followUpId).get();
            const data = doc.data();

            const insights = {
                followUpId: followUpId,
                overallSatisfaction: this.calculateAverageRating(data),
                matchQuality: this.assessMatchQuality(data),
                improvements: this.identifyImprovements(data),
                analyzedAt: new Date()
            };

            await firebase.firestore().collection('feedback_insights').add(insights);

            // If satisfaction is low, flag for admin review
            if (insights.overallSatisfaction < 3) {
                await this.flagForAdminReview(followUpId, insights);
            }

        } catch (error) {
            console.error('Error analyzing feedback:', error);
        }
    }

    // Calculate average satisfaction rating
    calculateAverageRating(feedbackData) {
        const companyRating = feedbackData.company_feedback?.rating || 0;
        const consultantRating = feedbackData.consultant_feedback?.rating || 0;
        
        if (companyRating && consultantRating) {
            return (companyRating + consultantRating) / 2;
        } else if (companyRating || consultantRating) {
            return companyRating || consultantRating;
        }
        
        return 0;
    }

    // Assess the quality of the match
    assessMatchQuality(feedbackData) {
        const companyWouldRecommend = feedbackData.company_feedback?.wouldRecommend;
        const consultantWouldRecommend = feedbackData.consultant_feedback?.wouldRecommend;
        
        if (companyWouldRecommend && consultantWouldRecommend) {
            return 'excellent';
        } else if (companyWouldRecommend || consultantWouldRecommend) {
            return 'good';
        } else {
            return 'needs_improvement';
        }
    }

    // Identify areas for improvement
    identifyImprovements(feedbackData) {
        const improvements = [];
        
        const companyComments = feedbackData.company_feedback?.comments || '';
        const consultantComments = feedbackData.consultant_feedback?.comments || '';
        
        // Simple keyword analysis for common issues
        const allComments = (companyComments + ' ' + consultantComments).toLowerCase();
        
        if (allComments.includes('communication')) {
            improvements.push('communication_skills');
        }
        if (allComments.includes('timeline') || allComments.includes('deadline')) {
            improvements.push('timeline_management');
        }
        if (allComments.includes('technical') || allComments.includes('skill')) {
            improvements.push('technical_expertise');
        }
        if (allComments.includes('price') || allComments.includes('cost')) {
            improvements.push('pricing_alignment');
        }
        
        return improvements;
    }

    // Flag low-satisfaction projects for admin review
    async flagForAdminReview(followUpId, insights) {
        try {
            const flagData = {
                followUpId: followUpId,
                reason: 'low_satisfaction',
                satisfaction: insights.overallSatisfaction,
                improvements: insights.improvements,
                flaggedAt: new Date(),
                reviewed: false
            };

            await firebase.firestore().collection('admin_flags').add(flagData);

            // Send alert to admin
            await this.emailService.sendEmail(
                'admin@companeeds.com',
                'Low Satisfaction Alert - Review Required',
                `
                <h3>Project Requires Review</h3>
                <p>A project has received low satisfaction ratings and requires admin attention.</p>
                <p><strong>Follow-up ID:</strong> ${followUpId}</p>
                <p><strong>Satisfaction Score:</strong> ${insights.overallSatisfaction}/5</p>
                <p><strong>Areas for Improvement:</strong> ${insights.improvements.join(', ')}</p>
                <p>Please review in the admin dashboard.</p>
                `
            );

        } catch (error) {
            console.error('Error flagging for admin review:', error);
        }
    }

    // Generate relationship management insights
    async generateRelationshipInsights() {
        try {
            const followUps = await firebase.firestore()
                .collection('follow_ups')
                .where('status', '==', 'completed')
                .get();

            const insights = {
                totalProjects: followUps.size,
                averageSatisfaction: 0,
                repeatClients: 0,
                topPerformingConsultants: [],
                commonImprovements: {},
                generatedAt: new Date()
            };

            let totalSatisfaction = 0;
            const consultantPerformance = {};
            const improvementCounts = {};

            followUps.forEach(doc => {
                const data = doc.data();
                
                // Calculate satisfaction
                const satisfaction = this.calculateAverageRating(data);
                totalSatisfaction += satisfaction;
                
                // Track consultant performance
                const consultantEmail = data.consultantEmail;
                if (!consultantPerformance[consultantEmail]) {
                    consultantPerformance[consultantEmail] = {
                        projects: 0,
                        totalSatisfaction: 0,
                        averageSatisfaction: 0
                    };
                }
                consultantPerformance[consultantEmail].projects++;
                consultantPerformance[consultantEmail].totalSatisfaction += satisfaction;
                consultantPerformance[consultantEmail].averageSatisfaction = 
                    consultantPerformance[consultantEmail].totalSatisfaction / 
                    consultantPerformance[consultantEmail].projects;
                
                // Track improvement areas
                const improvements = this.identifyImprovements(data);
                improvements.forEach(improvement => {
                    improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
                });
            });

            insights.averageSatisfaction = totalSatisfaction / followUps.size;
            insights.commonImprovements = improvementCounts;
            
            // Get top performing consultants
            insights.topPerformingConsultants = Object.entries(consultantPerformance)
                .sort((a, b) => b[1].averageSatisfaction - a[1].averageSatisfaction)
                .slice(0, 5)
                .map(([email, performance]) => ({ email, ...performance }));

            await firebase.firestore().collection('relationship_insights').add(insights);
            
            return insights;

        } catch (error) {
            console.error('Error generating relationship insights:', error);
            return null;
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FollowUpSystem;
} else {
    window.FollowUpSystem = FollowUpSystem;
}