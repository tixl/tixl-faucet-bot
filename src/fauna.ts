const faunadb = require("faunadb"),
  q = faunadb.query;
const client = new faunadb.Client({ secret: process.env.FAUNA_KEY });

const LIMIT = (Number(process.env.LIMIT_MINUTES) || 2880) * 60 * 1000; // 2 days

export const canUserReceive = async (username: string) => {
  try {
    const result = await client.query(
      q.Get(q.Match(q.Index("receivers_username"), username))
    );
    if (result) {
      const timestamp = result.data.timestamp;
      if (Date.now() > timestamp + LIMIT) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  } catch (error) {
    return true;
  }
};

export const updateOrCreateUserTimestamp = async (username: string) => {
  let ref;
  try {
    ref = await client.query(
      q.Select("ref", q.Get(q.Match(q.Index("receivers_username"), username)))
    );
  } catch (error) {
    // not found
  }
  if (ref) {
    try {
      await client.query(
        q.Update(ref, { data: { username, timestamp: Date.now() } })
      );
    } catch (error) {
      console.log(error);
    }
  } else {
    try {
      await client.query(
        q.Create(q.Collection("receivers"), {
          data: { username, timestamp: Date.now() }
        })
      );
    } catch (error) {
      console.log(error);
    }
  }
};
