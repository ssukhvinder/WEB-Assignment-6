const Sequelize = require('sequelize');
var sequelize = new Sequelize('xpgpdijh', 'xpgpdijh', 'EfBsPhmI5vnUokvt8mxzOOrUDslJie7r', {
    host: 'lucky.db.elephantsql.com (lucky-01)',
    dialect: 'postgres',
    port: 5432,
dialectOptions: {
ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});


var Product = sequelize.define('Product',{  
     body : Sequelize.TEXT,
     title : Sequelize.STRING,
     postDate : Sequelize.DATE,
    featureImage : Sequelize.STRING,
    published : Sequelize.BOOLEAN


})
var Category = sequelize.define('Category',{
    category : Sequelize.STRING
})
Product.belongsTo(Category, {foreignKey: 'category'});

module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        sequelize.sync().then((Product) => {
            resolve();
        }).then((Category) => {
            resolve();
        }).catch((err) => {
            reject("unable to sync the database");
        });
        reject();
    });
}

module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        fs.readFile('./data/products.json', 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                products = JSON.parse(data);

                fs.readFile('./data/categories.json', 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        categories = JSON.parse(data);
                        resolve();
                    }
                });
            }
        });
    });
}

module.exports.getAllProducts = () => {
    return new Promise((resolve, reject) => {
        sequelize.sync().then(() => {
            resolve(Product.findAll());
        }).catch((err) => {
            reject("no results returned.");
        });
    });
}
module.exports.getPublishedProducts = () => {
    return new Promise((resolve, reject) => {
        sequelize.sync().then(() => {
            resolve(Product.findAll());
        }).catch((err) => {
            reject("no results returned.");
        });
    });
}

module.exports.getEmployeesByCategory = (category) => {
    return new Promise((resolve, reject) => {
        sequelize.sync().then(() => {
            resolve(Product.findAll({
                where:{
                    category:category
            }}));
        }).catch((err) => {
            reject("no results returned.");
        });
    });
}

module.exports.getproductsByMinDate = function(minDateStr) {
    return new Promise((resolve, reject) => {
        sequelize.sync().then(() => {
            const { gte } = Sequelize.Op;

Product.findAll({
    where: {
postDate: {
            [gte]: new Date(minDateStr)
        }
    }
})

        }).catch((err) => {
            reject("no results returned.");
        });
    });
}
    
    module.exports.getPublishedProductsByCategory = (category) => {
        return new Promise((resolve, reject) => {
            sequelize.sync().then(() => {
                resolve(Product.findAll({
                    where:{
                        category: category
                    }
                }));
                }).catch((err) => {
                    reject("no results returned.");
            });
        });
    }

    module.exports.getProductById = (id) => {
        return new Promise((resolve, reject) => {
            sequelize.sync().then(() => {
                resolve(Product.findAll({
                    where:{
                        id:id
                    }
                }));
                }).catch((err) => {
                    reject("no results returned.");
            });
        });
    }
    module.exports.addProduct = (productData) => {
        productData.published = (productData.published) ? true : false;
        return new Promise((resolve, reject) => {
            sequelize.sync().then(() => {
                for (let x in productData) {
                    if(productData[x] == ""){
                        productData[x] = null;
                    }
                }
                resolve(Product.create({
                    body : productData.body,
                    title: productData.title,
                    postDate : new Date(),
                    featureImage : productData.featureImage,
                    published : productData.published
                    }));
                }).catch(() => {
                    reject("unable to create employee.");
                });
            }).catch(() => {
                reject("unable to create employee.");
        });
    }

module.exports.getCategories = () => {
    return new Promise((resolve, reject) => {
        sequelize.sync().then(() => {
            resolve(Category.findAll());
        }).catch((err) => {
            reject("no results returned.");
        });
    });
}


module.exports.deleteCategoryById = function (id) {
    return new Promise(function (resolve, reject) {
      Category.destroy({
        where: { categoryId: id }
      }).then(function (data) {
        resolve("destroyed");
      }).catch(function () {
        reject("no results returned");
      })
    });
  }

module.exports.deleteProductById = function (id) {
    return new Promise(function (resolve, reject) {
      Product.destroy({
        where: { productId: id }
      }).then(function () {
        resolve();
      }).catch(function () {
        reject("unable to Unable to Remove Product / Product not found Product");
      });
    });
}

