'use strict';

module.exports = (app) => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;
    const ObjectId = Schema.ObjectId;

    const MessageSchema = new Schema({
        type: { type: String }, // 消息形式 at === @
        master_id: { type: ObjectId },// 
        author_id: { type: ObjectId },// 作者id
        topic_id: { type: ObjectId }, // 文章id
        reply_id: { type: ObjectId }, // 回复id
        has_read: { type: Boolean, default: false }, //是否已读
        create_at: { type: Date, default: Date.now },
    });

    MessageSchema.index({ master_id: 1, has_read: -1, create_at: -1 });

    return mongoose.model('Message', MessageSchema);
};
