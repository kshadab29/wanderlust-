const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js")
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const expressError = require("./utils/expressError.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/users.js");
const userRouter = require("./routes/user.js")
const {isLoggedIn, saveRedirectUrl} = require("./middleware.js")


main().then(() => {
    console.log("connected to database");
}).catch((err) => {
    console.log(err)
})

async function main() {
    await mongoose.connect(MONGO_URL);
}
app.listen(8080, () => {
    console.log("server is listening");
})

app.get("/", (req, res) => {
    res.send("root directory")
})

const validateError = (req, res, next) => {
    let { error } = listingSchema.validate(res.body);
    if (error) {
        throw new expressError(400, result.error);
    }
    else {
        next();
    }
}

const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(res.body);
    if (error) {
        throw new expressError(400, result.error);
    }
    else {
        next();
    }
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: + 7 * 24 * 60 * 60 * 1000,
    },
    httpOnly: true,
}

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.currUser = req.user;
    next();
});

// index route
app.get("/listings", async (req, res) => {
    const totalList = await Listing.find({})
    res.render("listing/index.ejs", { totalList })
})

// sign up form 
app.get("/signup", (req, res) => {
    res.render("users/signup.ejs")
})

app.post("/signup", wrapAsync(async (req, res) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser)
        req.login(registeredUser,(err)=>{
           if(err){
            return next(err)
           }
           req.flash("success", "welcome to wanderlust");
           res.redirect("/listings")
        })
    } catch (err) {
        req.flash("success", err)
        res.redirect("/signup");
    }
}))

// login form 
app.get("/login", (req, res) => {
    res.render("users/login.ejs")
})

app.post("/login",saveRedirectUrl, passport.authenticate('local', { failureRedirect: "/login", failureFlash: true }), async (req, res) => {
    req.flash("success", "Welcome back to wanderlust you are logged in!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
})

// logout route
app.get("/logout", (req, res, next)=>{
   req.logout((err)=>{
    if(err){
        next(err)
    }
    req.flash("success", "you are logged out!");
    res.redirect("/listings");
   })
})

// new route
app.get("/listings/new", isLoggedIn,(req, res) => {
    res.render("listing/new.ejs");
});

// show route
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews").populate("owner");
    res.render("listing/show.ejs", { listing })
}));

// create route
app.post("/listings", validateError, wrapAsync(async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    console.log(req.user)
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
})
);

// edit route
app.get("/listings/:id/edit",isLoggedIn,wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listing/edit.ejs", { listing })
}))

// update route
app.put("/listings/:id",isLoggedIn, validateError, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let listing = await listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("sucess", "You dont have permission to edit");
        res.redirect(`/listings/${id}`);
    }
     await Listing.findByIdAndUpdate(id, { ...req.body.listing })
    console.log(listing)
    res.redirect("/listings")
})
);

// delete route
app.delete("/listings/:id",isLoggedIn, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedList = await Listing.findByIdAndDelete(id)
    console.log(deletedList);
    res.redirect("/listings");
}));

// reviews route
app.post("/listings/:id/reviews", validateReview, wrapAsync, async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review)

    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();

    console.log("new review saved");
    res.redirect(`/listings/${listing._id}`);
});

app.all("*", (req, res, next) => {
    next(new expressError(404, "Page Not Found"))
});

app.use((err, req, res, next) => {
    let { statuscode = 500, message = "something went wrong" } = err
    res.render("listing/error.ejs", { message })
});



