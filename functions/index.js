/**
 * Firebase Cloud Function: Outbreak Alert Trigger
 * 
 * This function listens for new diagnosis documents in Firestore.
 * If it detects 3 or more cases of the same condition in the same district 
 * within a 24-hour window, it triggers an outbreak alert.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

exports.onDiagnosisCreated = functions.firestore
    .document('diagnoses/{diagnosisId}')
    .onCreate(async (snap, context) => {
        const newCase = snap.data();
        const district = newCase.district;
        const condition = newCase.suspectedCondition;
        
        const now = admin.firestore.Timestamp.now();
        const oneDayAgo = new Date(now.toDate().getTime() - 24 * 60 * 60 * 1000);

        // Query for similar cases in the same district within last 24h
        const recentCasesQuery = await db.collection('diagnoses')
            .where('district', '==', district)
            .where('suspectedCondition', '==', condition)
            .where('timestamp', '>', oneDayAgo)
            .get();

        const caseCount = recentCasesQuery.size;

        // Threshold for outbreak alert
        if (caseCount >= 3) {
            console.log(`OUTBREAK DETECTED: ${caseCount} cases of ${condition} in ${district}`);
            
            // 1. Log the alert to Firestore for the dashboard
            await db.collection('alerts').add({
                district,
                condition,
                caseCount,
                timestamp: now,
                status: 'ACTIVE'
            });

            // 2. (Optional) Send Push Notifications to District Officials
            // await admin.messaging().sendToTopic(`outbreaks_${district}`, {
            //     notification: {
            //         title: 'OUTBREAK ALERT',
            //         body: `${caseCount} cases of ${condition} detected in ${district}.`
            //     }
            // });
        }
    });
