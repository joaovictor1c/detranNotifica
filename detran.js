const axios = require('axios');
const TelegramBot =  require('node-telegram-bot-api');
const Agent = require('socks5-https-client/lib/Agent')
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
    console.log("dia de agendamento recuperado com sucesso : " + dayDetran)

    const millisecondsToAdd = days * 24 * 60 * 60 * 1000;
    const appointment = new Date(Date.now() + millisecondsToAdd);

    try {
        if(appointment > dayDetran){
            const bot = new TelegramBot(
                telegramBotToken, 
                {   
                    polling: true
                }
            );

            bot.sendMessage(telegramChatId, 'Existe um agendamento disponivel para carro no detran no dia ' + dayDetran);

            console.log("Conseguiu encontrar agendamento, novo envio em 10 min");
            
            currentIntervalId = setInterval(agendarDetran, retryTimeSuccess);
        }else{
            console.log("Nao conseguiu encontrar agendamento, nova tentativa em 5 min");
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

agendarDetran();


