import mongoose from "mongoose"

const LastSchema = new mongoose.Schema({
    where: {
        type: String,
        required: true
    },
    guid: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Last = mongoose.models.Last || mongoose.model("Last", LastSchema);

export default Last
