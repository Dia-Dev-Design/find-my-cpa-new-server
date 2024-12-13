const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
  {
    name: { type: String, required: true },
    content: { type: String, required: true },
    title: { type: String, maxLength: 30 },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    cpaId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = model("Comment", commentSchema);
