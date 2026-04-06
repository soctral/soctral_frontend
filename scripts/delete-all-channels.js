#!/usr/bin/env node
/**
 * Delete all Stream Chat channels and clear local chat storage.
 *
 * Part 1 - Stream (run with Node): Deletes all channels from Stream's backend.
 * Part 2 - LocalStorage (run in browser): See clear-chat-storage.html
 *
 * Usage:
 *   STREAM_API_KEY=your_api_key STREAM_SECRET=your_secret node scripts/delete-all-channels.js
 *
 * Get your API Key and Secret from: https://dashboard.getstream.io → API Keys
 */

import { StreamChat } from "stream-chat";

const API_KEY = process.env.STREAM_API_KEY || "39h4m4hmwswh";
const SECRET =
  "afb8mrewpcdmqd27y2tgw9zptakc7xrun6s3kbm75fuf9tjxh6tztm6t6rstwna5";
// process.env.STREAM_SECRET;

if (!SECRET) {
  console.error(
    "❌ STREAM_SECRET is required. Get it from https://dashboard.getstream.io → API Keys",
  );
  console.error(
    "   Usage: STREAM_SECRET=your_secret node scripts/delete-all-channels.js",
  );
  process.exit(1);
}

const serverClient = StreamChat.getInstance(API_KEY, SECRET);

async function deleteAllChannels() {
  console.log("🗑️  Fetching all messaging channels...\n");

  let offset = 0;
  const limit = 100;
  let totalDeleted = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      const channels = await serverClient.queryChannels(
        { type: "messaging" },
        { last_message_at: -1 },
        { limit, offset },
      );

      const list = Array.isArray(channels)
        ? channels
        : channels?.channels || [];
      if (list.length === 0) {
        if (totalDeleted === 0) {
          console.log("✅ No channels found. Nothing to delete.");
        }
        break;
      }

      for (const channel of list) {
        const cid = channel.cid || channel.id;
        try {
          await channel.delete();
          totalDeleted++;
          console.log(`  ✓ Deleted: ${cid}`);
        } catch (err) {
          console.error(`  ✗ Failed to delete ${cid}:`, err.message);
        }
      }

      offset += limit;
      hasMore = list.length === limit;
    }

    console.log(`\n✅ Done. Deleted ${totalDeleted} channel(s) from Stream.`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.message?.includes("queryChannels")) {
      console.error(
        "\n   Note: The server SDK may restrict querying all channels.",
      );
      console.error(
        "   Alternative: Delete channels manually from the Stream Dashboard → Channel Viewer.",
      );
    }
    process.exit(1);
  }
}

deleteAllChannels();
