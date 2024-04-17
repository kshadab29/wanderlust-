class expressError extends Error{
    constructor(){
        super(statuscode, message);
        this.statuscode = statuscode;
        this.message = message;
    };
};

module.exports = expressError;