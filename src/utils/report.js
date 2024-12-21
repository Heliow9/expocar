import { doc, setDoc, getDocs, getDoc, arrayUnion, query, collection, where } from 'firebase/firestore';
import { firestore } from '../database/firebase';
import { Alert } from 'react-native';
import XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Timestamp } from 'firebase/firestore';

const convertToUTCAndCreateTimestamp = (date) => {
    const dateInUTC = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    return Timestamp.fromDate(dateInUTC);
};



export const FetchByUserDate = async (driverId, startDate, endDate) => {

    try {
        // Verificando se as datas fornecidas são válidas
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        // Verificando se a data inicial e final são válidas
        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
            console.error("Data inválida fornecida");
            return [];
        }

        // Função para limpar horas, minutos e segundos da data
        const clearTime = (date) => {
            const newDate = new Date(date);
            newDate.setHours(0, 0, 0, 0); // Zera as horas, minutos e segundos
            return newDate;
        };

        const startClearDate = clearTime(parsedStartDate);
        const endClearDate = clearTime(parsedEndDate);

        // Logando as datas limpas para verificar
        console.log("Start Date:", startClearDate);
        console.log("End Date:", endClearDate);

        // Referência para o documento do motorista dentro da coleção 'fuel'
        const driverDocRef = doc(firestore, 'fuel', driverId);

        // Obtendo o documento do motorista
        const driverDocSnap = await getDoc(driverDocRef);

        if (!driverDocSnap.exists()) {
            console.error("Documento do motorista não encontrado.");
            return [];
        }

        // Obtendo os abastecimentos armazenados no array 'abastecimentos'
        const abastecimentos = driverDocSnap.data().abastecimentos || [];

        // Filtrando os abastecimentos dentro do intervalo de datas, sem considerar horas
        const filteredAbastecimentos = abastecimentos.filter((abastecimento) => {
            const abastecimentoDate = abastecimento.date.toDate(); // Converte para Date
            const clearAbastecimentoDate = clearTime(abastecimentoDate); // Limpa a hora do abastecimento

            return clearAbastecimentoDate >= startClearDate && clearAbastecimentoDate <= endClearDate;
        });

        // Exibindo no console os abastecimentos encontrados
        exportarHistoricoComoXLSX(filteredAbastecimentos);

        return filteredAbastecimentos; // Retorna os dados encontrados
    } catch (error) {
        console.error("Erro ao buscar os abastecimentos:", error);
        return [];
    }

};



export const FetcCCDate = async (cc) => {

}



export const FetchDate = async () => {

}


const exportarHistoricoComoXLSX = async (historico) => {
    console.log('teste')
    if (!historico || historico.length === 0) {
        Alert.alert('Aviso', 'Não há dados para exportar.');
        return;
    }

    try {
        // Formatar dados para a planilha
        const data = [
            ['Histórico de Abastecimento', '', '', '', '', ''], // Linha 1 com texto mesclado
            ['Usuario', 'Placa', 'Data', 'Km', 'Modelo', 'Combustivel'], // Cabeçalhos
            ...historico.reverse().map((item) => [
                item.userName || 'N/A',
                item.vehicleId.plate.toUpperCase() || 'N/A',
                item.date.toDate().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) || 'N/A',
                item.km || 'N/A',
                item.vehicleId.modelo || 'N/A',
                item.vehicleId.combustivel || 'N/A',
            ]),
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);

        // Mesclar as células da linha 1
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Mescla de A1 até F1
        ];

        // Definir estilo para a célula mesclada
        ws['A1'].s = {
            alignment: { horizontal: 'center', vertical: 'center' }, // Centraliza o texto
            font: { bold: true }, // Aplica negrito
            wrapText: true, // Faz o texto quebrar linha, se necessário
        };


        ws['!cols'] = [
            { wch: 20 }, // Largura para a coluna "Usuario"
            { wch: 20 }, // Largura para a coluna "Data"
            { wch: 25 }, // Largura para a coluna "Quantidade"
            { wch: 12 }, // Largura para a coluna "Km"
            { wch: 20 }, // Largura para a coluna "Preço"
            { wch: 20 }, // Largura para a coluna "Total"
        ];


        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Histórico');

        // Gerar o arquivo como Base64
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

        // Caminho do arquivo no Expo
        const fileUri = `${FileSystem.documentDirectory}historico_abastecimento.xlsx`;

        // Salvar o arquivo
        await FileSystem.writeAsStringAsync(fileUri, wbout, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Compartilhar o arquivo
        await Sharing.shareAsync(fileUri);
    } catch (error) {
        console.error('Erro ao exportar XLSX:', error);
        Alert.alert('Erro', 'Não foi possível exportar o histórico.');
    }
};