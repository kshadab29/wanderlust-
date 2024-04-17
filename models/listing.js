const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ListingSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    image: {
        type: String,
        default: "https://images.unsplash.com/photo-1541328519168-a91fdd710096?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8d2FuZGVybHVzdHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=600&q=60",
        set : (v) => v === "" ? "https://images.unsplash.com/photo-1541328519168-a91fdd710096?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8d2FuZGVybHVzdHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=600&q=60" : v,
    },
    price: Number,
    location: String,
    country: String,
    reviews:[
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
})

const Listing = mongoose.model("Listing", ListingSchema);

module.exports = Listing;