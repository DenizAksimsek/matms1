//@ts-check
const express = require("express"),
  admin = require('firebase-admin'),
  // @ts-ignore
  serviceAccount = require("../serviceAccount.json"),
  bodyParser = require("body-parser")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mat-ms.firebaseio.com"
})

const db = admin.firestore()
db.settings({
  timestampsInSnapshots: true
})

// Sunucu

/**
 * 
 * @param {FirebaseFirestore.DocumentSnapshot} belge 
 * @returns {Promise} arayüz için veri
 */
async function adaptDoc(belge) {
  // TODO: refactor
  return {
    ...belge.data(),
    id: belge.ref.id,
    yanitlar: (await belge.ref.collection("Yanıtlar")
      .listDocuments()
      .then(refler =>
        Promise.all(refler.map(ref => ref.get()))
      )).map(snapshot => snapshot.data())
  }
}

const app = express()
const sunucu = app.listen(3000)

app.use(express.static('wwwroot'))
app.use(bodyParser.urlencoded())
app.set('views', './views')
app.set('view engine', 'pug')

app.get("/", (req, res) => {
  db.collection("Sorular").get().then(
    (snapshot) => {
      let belgeler = snapshot.docs.map(adaptDoc)
      Promise.all(belgeler).then(sorular =>
        res.render(__dirname + "/views/index.pug", {
          sorular
        })
      )
    }
  )
})

app.get("/soru/", (req, res) => {
    db.collection("Sorular").doc(req.query.id).get().then((snapshot) => {
        if (!snapshot.data) {
          res.status(404);
          return
        }
        adaptDoc(snapshot).then((doc) => {
          console.log(doc)
          res.render(__dirname + "/views/soru.pug", {
            soru: doc
          })
        })
      }

    )
  }

)

app.get("/sor", (req, res) => {})

app.post("soru", (req, res) => {

})

app.post("/yanitla", (req, res) => {
  let yanit
  try {
    yanit = {
      "Yazan": req.body["Yazan"],
      "İçerik": req.body["İçerik"]
    }
  } catch {
    res.status(400)
    console.log(req.body, req.query)
    return
  }
  if (
    !req.query.id ||
    typeof yanit["Yazan"] !== "string" ||
    typeof yanit["İçerik"] !== "string"
  ) {
    res.status(400)
    console.log("sfds")
    return
  }
  console.log(yanit)
  db.collection("Sorular").doc(req.query.id).collection("Yanıtlar").add(yanit)
  res.status(200)
  res.send()

})