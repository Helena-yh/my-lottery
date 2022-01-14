var ref = require('./db'), sequelize = ref.sequelize;
// force update db
sequelize.sync({alter: true}).then(()=>{
    console.log('force update sucess')
}).catch((err)=>{
    console.log('err',err)
})