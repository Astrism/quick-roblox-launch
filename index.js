const fs = require("fs")
const shortcut = require("get-windows-shortcut-properties")
const colors = require("colors")
const os = require("os")
const axios = require("axios")
const { exec } = require("child_process")
const noblox = require("noblox.js")

const user = os.userInfo().username
const lnkDir = `C:\\Users\\${user}\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Roblox`
const lnkFolder = fs.readdirSync(lnkDir)
let executable

async function findExecutable() {
    return new Promise((resolve,) => {
        if (lnkFolder.find(f => f.toLowerCase().includes("player"))) {
            const { TargetPath } = shortcut.sync(lnkDir + "\\" + lnkFolder.find(f => f.toLowerCase().includes("player")))[0]
            executable = `${TargetPath}\\..\\RobloxPlayerBeta.exe`
            resolve()
        } else {
            throw new Error(`${colors.bold.red("!")} Couldn't find Roblox files`)
        }
    })
}
async function getcsrf(cookie) {
    return new Promise(async (resolve) => {
        await noblox.setCookie(cookie)
        const response = await noblox.getGeneralToken()
        resolve(response)
        await noblox.clearSession(await noblox.jar())
    })
}
async function authTicket(cookie, csrf) {
    return new Promise((resolve, reject) => {
        axios({
            method: "POST",
            url: "https://auth.roblox.com/v1/authentication-ticket",
            maxRedirects: 0,
            data: {},
            headers: {
                "x-csrf-token": csrf,
                "referer": "https://www.roblox.com",
                "cookie": `.ROBLOSECURITY=${cookie}`
            }
        }).then((response) => {
            resolve(response.headers["rbx-authentication-ticket"])
        }).catch(err => {
            throw err
        })
    })
}
function assetgame(placeid, jobid, time) {
    return `https://assetgame.roblox.com/game/PlaceLauncher.ashx?request=RequestGame^&browserTrackerId=${time}^&placeId=${placeid}${jobid ? "^&gameId=" + jobid : ""}^&isPlayTogetherGame=false`
}

async function launch(cookie, placeid, jobid) {
    return new Promise(async (resolve) => {
        try {
            if (!executable) await findExecutable()

            const time = new Date().getTime()
            const csrf = await getcsrf(cookie)
            const ticket = await authTicket(cookie, csrf)
            const link = assetgame(placeid, jobid, time)
            const args = `--play -t ${ticket} -j ${link} -b ${time} --launchtime=${time} --rloc en_us --gloc en_us`

            exec(`"${executable}" ${args}`)
        } catch (err) {
            throw err
        }
    })
}

launch("YOUR COOKIE", "PLACE ID", "JOB ID/SERVER ID, OPTIONAL")
