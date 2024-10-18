import { Route } from "@linzb93/event-router";
import sql from "../helper/sql";

const route = Route();

route.handle("get", async () => {
  return sql((db) => db.account);
});

route.handle("save", async (req) => {
  sql((db) => {
    db.account = {
      ...req.params,
      id: 1,
    };
  });
});

export default route;
