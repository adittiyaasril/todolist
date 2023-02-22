require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItem = [];

// detect error
main().catch((err) => console.log(err));

// connect to mongoose
async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}

// make schema
const itemsSchema = new mongoose.Schema({
  name: String,
});

// make model
const Item = mongoose.model("Item", itemsSchema);

// make document
const item1 = new Item({
  name: "Welcome to your to do List!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<--- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

// new Schema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

// model
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItem) {
    if (foundItem.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Input Successfully");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItem });
    }
  });
});

app.get("/:costumeListName", function (req, res) {
  const costumeListName = _.capitalize(req.params.costumeListName);

  List.findOne({ name: costumeListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Creat a new list
        const list = new List({
          name: costumeListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + costumeListName);
      } else {
        //Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  let itemName = req.body.newItem;
  let listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox.trim();
  const listName = req.body.listName.trim();

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Delete Succesfully");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log("Server is started on port " + PORT);
});