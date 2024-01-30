import mongoose from "mongoose"

const ProxySchema = new mongoose.Schema({
    ip: {
        type: String
    },
    port: {
        type: String
    },
    username: {
        type: String
    },
    password: {
        type: String
    },
    enabled: {
        type: Number,
        defaultValue: 1
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Proxy = mongoose.models.Proxy || mongoose.model("Proxy", ProxySchema)

export default Proxy