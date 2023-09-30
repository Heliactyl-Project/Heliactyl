const fetch = require('node-fetch')
const settings = require('../settings.json')

module.exports = () => {
        return (await.fetch(
                settings.pterodactyl.domain + "/api/application/servers?per_page=1000000",
                {
                    headers: {
                        "Authorization": `Bearer ${settings.pterodactyl.key}`
                    }
                }
            )).json();
}
