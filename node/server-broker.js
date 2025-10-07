import Broker from "./src/broker/broker.js";

const broker = new Broker();
await broker.perform();
