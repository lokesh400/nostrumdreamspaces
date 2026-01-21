const express = require("express");
const router =  express.Router();
const User = require('../models/User');
const Enquiry = require('../models/Enquiry');
const NewsLetter = require('../models/NewsLetter');
const nodemailer = require("nodemailer")


  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/user/login');
  }


  function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    res.render("./error/accessdenied.ejs");
  }

router.get('/enquiries',ensureAuthenticated,isAdmin, async (req, res) => {
    try {
        const enquiries = await Enquiry.find();
        res.render('admin/allEnquiry', { enquiries, success_msg: req.flash('success_msg') });
    } catch (error) {
        console.error("Error fetching enquiries:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Delete an enquiry
router.delete('/admin/enquiries/:id',ensureAuthenticated,isAdmin, async (req, res) => {
    try {
        await Enquiry.findByIdAndDelete(req.params.id);
        req.flash('success_msg', "Enquiry deleted successfully");
        res.redirect('/enquiries')
    } catch (error) {
        console.error("Error deleting enquiry:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

router.post("/add/new/query", async (req, res) => {
    try {
        const { name, mobile, email, query } = req.body;
        const enquiry = new Enquiry({ name, mobile, email, query });
        await enquiry.save();
        const newsletter = new NewsLetter({ email });
        await newsletter.save();
        console.log(`Enquiry email sent successfully to Admin.`);
        res.redirect('/');
    } catch (error) {
        res.redirect('/');
    }
});

router.get('/add/new/query', (req,res)=>{
    res.render('contactUs.ejs')
})

module.exports = router;
