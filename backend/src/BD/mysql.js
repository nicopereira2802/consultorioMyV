//En este archivo va la conexion y todas las consultas a la base de datos
const mysql = require('mysql');
const config = require('../config');

const dbconfig = {
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
}

let conexion;

function conMysql(){    //Conexion con la BD, informa de errores
    conexion = mysql.createConnection(dbconfig);

    conexion.connect((err) => {
        if (err){
            console.log('[dr error]', err);
            setTimeout(conMysql)
        }else{
            console.log('Base de datos conectada')
        }
    });

    conexion.on('error', err => {      //Si se pierde la conexion
        console.log('[dr error]', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST'){
            conMysql();
        }else{
            throw err;
        }
    })
} 

conMysql();

function todos(tabla){  //Ejemplo de consulta que trae todos los valores de la tabla
    return new Promise((resolve, reject) => {
        conexion.query(`SELECT * FROM ${tabla}`, (error, result) => {
            return error ? reject(error) : resolve(result);
        });
    });
}

function uno(tabla, id){ 
    return new Promise((resolve, reject) => {
        conexion.query(`SELECT * FROM ${tabla} WHERE id=${id}`, (error, result) => {
            return error ? reject(error) : resolve(result);
        });
    });
}

///////////////////////////////////////////////////

function insertar(tabla, data){
    return new Promise((resolve, reject) => {
        conexion.query(`INSERT INTO ${tabla} SET ?`, data, (error, result) => {
            return error ? reject(error) : resolve(result);
        });
    });
}

function actualizar(tabla, data){
    return new Promise((resolve, reject) => {
        conexion.query(`UPDATE ${tabla} SET ? WHERE id= ?`, [data, data.id], (error, result) => {
            return error ? reject(error) : resolve(result);
        });
    });
}

function agregar(tabla, data){
    if(data && !data.id){
        return insertar(tabla, data); // Para objetos nuevos
    }else{
        return actualizar(tabla, data);  // Para objetos ya creados
    }
}

/////////////////////////////////////////////////

function eliminar(tabla, data){
    return new Promise((resolve, reject) => {
        conexion.query(`DELETE FROM ${tabla} WHERE id = ? `, data.id , (error, result) => {
            return error ? reject(error) : resolve(result);
        });
    });
}

module.exports = {
    todos,
    uno,
    agregar,
    eliminar,
}