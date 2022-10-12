const axios = require('axios');
require('dotenv').config();

var cpf = process.env.CPF;
var dataNascimento =  process.env.DATANASCIMENTO;
var codAptidao =  process.env.CODAPTIDAO;
var tipoExame =  process.env.TIPOEXAME;
var days =  process.env.DAYS;

const retryTimeFail =  process.env.RETRYTIMEFAIL;
const retryTimeSuccess = process.env.RETRYTIMESUCCESS;

const telegramBotToken = process.env.TELEGRAMTOKEN;
const telegramChatId = process.env.TELEGRAMIDCHAT;

var retry = 0;
var currentIntervalId;

async function agendarDetran(){

    clearInterval(currentIntervalId);

    const response = await axios({
        method: "POST",
        url: "https://online7.detran.pe.gov.br/MvcHabilitacao/Agendamento/PesquisarDataDisponibilidadeTecnica?cpf="+ cpf +
        "&dataNascimento=" + dataNascimento + 
        "&codAptidao=" + codAptidao + 
        "&tipoExame=" + tipoExame,
        responseType: "application/json",
    })
        
    const dayDetran = createDate(response.data[0]);
    console.log("dia de agendamento recuperado com sucesso : " + formatDate(dayDetran))

    const millisecondsToAdd = days * 24 * 60 * 60 * 1000;
    const appointment = new Date(Date.now() + millisecondsToAdd);
    console.log("horario atual é de: " +  appointment.getHours());

    try {
        if(appointment > dayDetran){

            const message = 'Existe um agendamento disponivel para carro no detran no dia ' + formatDate(dayDetran);

            await axios({
                method: "GET",
                url: "https://api.telegram.org/bot"+ telegramBotToken +"/sendMessage?text="+ message +"&chat_id=" + telegramChatId,
                responseType: "application/json",
            })

            console.log("Conseguiu encontrar agendamento para o dia "+  formatDate(dayDetran) +", verifique o telegram");
            
            currentIntervalId = setInterval(agendarDetran, retryTimeSuccess);
        }else{
            console.log("Nao conseguiu encontrar agendamento");
            retry += 1;
            console.log("Numero de tentativas igual a: " + retry);
            currentIntervalId = setInterval(agendarDetran, retryTimeFail);
        }
    } catch(error){
        console.log("Erro na aplicacao");
        console.log(error);
    }
}

function createDate(date){
    let d = date.split("/");
    let dat = new Date(d[2] + '/' + d[1] + '/' + d[0]);
    return dat;     
}

function formatDate(date) {
    var year = date.getFullYear().toString();
    var month = (date.getMonth() + 101).toString().substring(1);
    var day = (date.getDate() + 100).toString().substring(1);
    return day + "/" + month + "/" + year;
}

// function verificarAgendamento(cpf, dataNascimento){
//     await axios({
//         method: "POST",
//         url: "https://online7.detran.pe.gov.br/MvcHabilitacao/Agendamento/ListaHorarioDisponibilidadeTeorica",
//         responseType: "application/json",
//         headers: { 'content-type': 'application/x-www-form-urlencoded' }
//     })
// }

agendarDetran();


