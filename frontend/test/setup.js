import { JSDOM } from "jsdom";
import net from "node:net";
import dgram from "node:dgram";
// Fail explicitly if any test tries to open a local server.
net.Server.prototype.listen = function () {
  throw new Error("Local servers are forbidden in these tests");
};
dgram.Socket.prototype.bind = function () {
  throw new Error("UDP listeners are forbidden in these tests");
};
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.FormData = dom.window.FormData;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
