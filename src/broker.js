// Importation de la librairie avec la syntaxe ES Module
import amqp from 'amqplib';

// Fonction asynchrone pour initier la connexion
async function startBroker() {
    const username = process.env.BROKER_USERNAME;
    const password = process.env.BROKER_PASSWORD; 
    const host = process.env.BROKER_HOST;
    const port = process.env.BROKER_PORT;

    const url = `amqps://${username}:${password}@${host}:${port}`;
    const queueName = `user.${password}`;

    try {
        console.log("Tentative de connexion au broker de messages...");

        const connection = await amqp.connect(url);
        const channel = await connection.createChannel();

        console.log(`Connexion reussie. En ecoute sur la file : ${queueName}`);

        channel.consume(queueName, (msg) => {
            if (msg !== null) {
                const messageContent = msg.content.toString();
                
                console.log("\n--- Nouveau message recu du Broker ---");
                
                try {
                    const parsedData = JSON.parse(messageContent);
                    console.log(parsedData);
                } catch (parseError) {
                    console.log("Message texte brut :", messageContent);
                }

                channel.ack(msg);
            }
        }, {
            noAck: false
        });

        connection.on('error', (err) => {
            console.error("Erreur de connexion au broker:", err);
        });

        connection.on('close', () => {
            console.warn("Connexion au broker fermee.");
        });

    } catch (error) {
        console.error("Impossible de se connecter au broker:", error.message);
    }
}


export { startBroker };