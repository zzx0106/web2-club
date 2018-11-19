'use strict';
module.exports = (app) => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;
    const ObjectId = Schema.ObjectId;

    const TopicSchema = new Schema({
        tab: [], // 分类
        title: { type: String }, // 标题
        content: { type: String }, // 内容
        author_id: { type: ObjectId }, // 作者
        author: { type: ObjectId, ref: 'User' }, // 关联到指定作者
        top: { type: Boolean, default: false }, // 置顶帖
        good: { type: Boolean, default: false }, // 精华帖
        reply_count: { type: Number, default: 0 }, // 回复数
        visit_count: { type: Number, default: 0 }, // 浏览数
        collect_count: { type: Number, default: 0 }, // 收藏数
        create_at: { type: Date, default: Date.now }, // 创时间
        update_at: { type: Date, default: Date.now }, // 更新时间
        last_reply: { type: ObjectId }, // 最后一次回复id
        last_reply_at: { type: Date, default: Date.now }, // 最后一次回复时间
        ups: { type: Array }, //主题点赞/
    });
    TopicSchema.index({ create_at: -1 });
    TopicSchema.index({ top: -1, last_reply_at: -1 });
    TopicSchema.index({ author_id: 1, create_at: -1 });

    return mongoose.model('Topic', TopicSchema);
};
