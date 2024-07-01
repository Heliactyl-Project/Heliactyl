const settings = require("../../settings.json");
const { CronJob } = require('cron')
const getAllServers = require('../../functions/getAllServers')
const fetch = require('node-fetch')

module.exports.load = async function (app, db) {

    app.get(`/api/renewalstatus`, async (req, res) => {
        if (!settings.renewals.status) return res.json({ error: true })
        if (!req.query.id) return res.json({ error: true })
        if (!req.session.pterodactyl) res.json({ error: true })
        if (req.session.pterodactyl.relationships.servers.data.filter(server => server.attributes.id == req.query.id).length == 0) return res.json({ error: true });

        const lastRenew = await db.get(`lastrenewal-${req.query.id}`)
        if (!lastRenew) return res.json({ text: 'Disabled' })

        if (lastRenew > Date.now()) return res.json({ text: 'Renewed', success: true })
        else {
            if ((Date.now() - lastRenew) > (settings.renewals.delay * 86400000)) {
                return res.json({ text: 'Last chance to renew!', renewable: true })
            }
            const time = msToDaysAndHours((settings.renewals.delay * 86400000) - (Date.now() - lastRenew))
            return res.json({ text: time, renewable: true })
        }
    })

    app.get(`/renew`, async (req, res) => {
        if (!settings.renewals.status) return res.send(`Renewals are currently disabled.`)
        if (!req.query.id) return res.send(`Missing ID.`)
        if (!req.session.pterodactyl) return res.redirect(`/login`)
        if (req.session.pterodactyl.relationships.servers.data.filter(server => server.attributes.id == req.query.id).length == 0) return res.send(`No server with that ID was found!`);

        const lastRenew = await db.get(`lastrenewal-${req.query.id}`)
        if (!lastRenew) return res.send('Disabled')

        if (lastRenew > Date.now()) return res.redirect(`/dashboard`)

        let coins = await db.get("coins-" + req.session.userinfo.id);
        coins = coins ? coins : 0;

        if (settings.renewals.cost > coins) return res.redirect(`/dashboard` + "?err=CANNOTAFFORDRENEWAL")

        await db.set("coins-" + req.session.userinfo.id, coins - settings.renewals.cost)

        let unsuspendrequest = await fetch(
            settings.pterodactyl.domain + "/api/application/servers/" + id + "/unsuspend",
            {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${settings.pterodactyl.key}`
                }
            }
        );
        
        if (!unsuspendrequest.ok) {
            return res.send(`An error has occured while attempting to unsuspend the server. Please contact an administrator.`)
        }

        const newTime = lastRenew + (settings.renewals.delay * 86400000)
        await db.set(`lastrenewal-${req.query.id}`, newTime)

        return res.redirect(`/dashboard` + `?success=RENEWED`)
    })

    new CronJob(`0 0 * * *`, () => {
        if (settings.renewals.status) {
            console.log('Running renewal check...')
            getAllServers().then(async servers => {
                for (const server of servers) {
                    const id = server.attributes.id
                    const lastRenew = await db.get(`lastrenewal-${id}`)
                    if (!lastRenew) continue

                    if (lastRenew > Date.now()) continue
                    if ((Date.now() - lastRenew) > (settings.renewals.delay * 86400000)) {
                        let suspendresult = await fetch(
                            settings.pterodactyl.domain + "/api/application/servers/" + id + "/suspend",
                            {
                                method: "post",
                                headers: {
                                    'Content-Type': 'application/json',
                                    "Authorization": `Bearer ${settings.pterodactyl.key}`
                                }
                            }
                        );
                        let ok = await suspendresult.ok;
                        if (ok !== true) continue;
                        console.log(`Server with ID ${id} failed renewal and was deleted.`)
                        await db.delete(`lastrenewal-${id}`)
                    }
                }
            })
            console.log('Renewal check over!')
        }
    }, null, true, settings.renewals.Tinmezone)
        .start()

};

function msToDaysAndHours(ms) {
    const msInDay = 86400000;
    const msInHour = 3600000;
    const msInMinute = 60000;

    const days = Math.floor(ms / msInDay);
    const hours = Math.floor((ms % msInDay) / msInHour);
    const minutes = Math.round(((ms % msInDay) % msInHour) / msInMinute);

    let pluralDays = 's';
    if (days === 1) {
        pluralDays = '';
    }

    let pluralHours = 's';
    if (hours === 1) {
        pluralHours = '';
    }

    let pluralMinutes = 's';
    if (minutes === 1) {
        pluralMinutes = '';
    }

    if (days === 0) {
        if (hours === 0) {
            return `${minutes}m left!`;
        }
        return `${hours}h ${minutes}m`;
    }

    return `${days}d ${hours}h ${minutes}m`;
}