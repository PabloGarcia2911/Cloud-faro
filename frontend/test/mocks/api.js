export const calls = [];
let products = [];
let contacts = [];
export function resetApi() {
  calls.length = 0;
  products = [];
  contacts = [];
}
export const api = {
  async get(path) {
    calls.push(["GET", path]);
    return {
      data:
        path === "/products"
          ? [...products]
          : path === "/contact"
            ? [...contacts]
            : { description: "API académica" },
    };
  },
  async post(path, body) {
    calls.push(["POST", path, body]);
    if (path === "/products") products.push({ ...body, id: 1 });
    else
      contacts.push({
        ...body,
        id: 1,
        senderId: "student",
        createdAt: "2026-09-29T12:00:00Z",
      });
    return { data: { id: 1, ...body } };
  },
  async put(path, body) {
    calls.push(["PUT", path, body]);
    products = [{ ...body, id: 1 }];
    return { data: products[0] };
  },
  async delete(path) {
    calls.push(["DELETE", path]);
    products = [];
    return { data: null };
  },
};
export const errorMessage = (e) => e.message;
