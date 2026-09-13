const db = require('../../BD/mysql');

const TABLA = 'pacientes';


module.exports = function (dbInyectada){

    let db = dbInyectada;

    if(!db){ //Si esta corrupta la base de datos la vuelve a pedir a la carpeta
        db = require('../../BD/mysql');
    }

    function todos() {
        return db.todos(TABLA);
    }

    function uno (id){
        return db.uno(TABLA, id);
    }

    function agregar (body){
        return db.agregar(TABLA, body);
    }

    function eliminar (body){
        return db.eliminar(TABLA, body);
    }

    return {
        todos, 
        uno,
        agregar,
        eliminar
    }
    
}