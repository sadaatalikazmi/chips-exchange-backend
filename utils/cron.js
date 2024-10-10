const cron = require('node-cron');
const colors = require('colors');
const stripe = require('stripe')('sk_test_51OJxzmJ76lSkrH49vh6jtKsSkXfUyYNlvHeXjV9dUebUKMZvvxYHwxGIFKOE8PSGwRYzIqsjjMPgSMmUDuz90tNj002aaQERG8');

cron.schedule('0 0 * * *', async () => {
    try {

        console.log('Removing expired time-based banners'.bgCyan);

        const refund = await stripe.refunds.retrieve('re_1Nispe2eZvKYlo2Cd31jOCgZ');

    } catch (e) { console.log(`Cron Error: ${e}`.bgRed) }
});