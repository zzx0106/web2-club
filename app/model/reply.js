'use strict';

module.exports = (app) => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;
    const ObjectId = Schema.ObjectId;

    const ReplySchema = new Schema(
        {
            content: { type: String }, // 回复内容
            topic_id: { type: ObjectId }, // 文章id
            author_id: { type: ObjectId }, // 作者
            reply_id: { type: ObjectId }, // 回复id
            create_at: { type: Date, default: Date.now },
            update_at: { type: Date, default: Date.now },
            ups: [Schema.Types.ObjectId], // 点赞列表
        },
        {
            usePushEach: true,
        }
    );

    ReplySchema.index({ topic_id: 1 });
    ReplySchema.index({ author_id: 1, create_at: -1 });

    return mongoose.model('Reply', ReplySchema);
};
