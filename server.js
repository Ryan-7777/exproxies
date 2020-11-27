const knex = require("./libs/database")
const Proxies = require("./libs/proxies")

const express = require("express")
const bodyParser = require("body-parser")
const md5 = require("apache-md5")
const Helper = require("./libs/helper")
const app = express()
const port = 3000

app.use(bodyParser.json())

app.get("/", async (req, res) => {
	return res.json({
		message: "Request landed.",
	})
})

app.get("/api/proxies", async (req, res) => {
	/**
	 * List all the proxies from the database as JSON format.
	 */

	const proxies = (await knex("proxies")).map(p => `${p.ip}:${p.port}:${p.user}:${p.pass}`)
	res.json(proxies)
})

app.post("/api/proxies", async (req, res) => {
	/**
	 * Change the passwords for proxies inside the request.
	 */

	for (const ip of req.body) {
		const proxy = await knex("proxies").where("ip", ip).first()

		if (proxy) {
			const pass = Helper.rs(5)
			await knex("proxies")
				.update({
					user: Helper.rs(5),
					pass: pass,
					pass_md5: md5(pass),
				})
				.where("ip", ip)
		} else {
			console.log(`[PROXIES] [${ip}] Cannot update proxy as it does not exist.`)
		}
	}

	await Proxies.reconfigure()

	res.json({
		message: "Successfully updated proxies.",
	})
})

app.listen(port, () => {
	console.log(`[PROXIES] Server started on: http://localhost:${port}`)
})