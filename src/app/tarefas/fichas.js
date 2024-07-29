import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, StatusBar, TextInput, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CriarBloco() {
    const [modalVisible, setModalVisible] = useState(false);
    const [colunaNome, setColunaNome] = useState('');
    const [colunas, setColunas] = useState([]);
    const [addFichaModalVisible, setAddFichaModalVisible] = useState(false);
    const [fichaNome, setFichaNome] = useState('');
    const [fichaModalVisible, setFichaModalVisible] = useState(false);
    const [fichaInput1, setFichaInput1] = useState('');
    const [selectedFicha, setSelectedFicha] = useState(null);
    const { blockName } = useLocalSearchParams();
    const [editingFichaId, setEditingFichaId] = useState(null);
    const [editedFichaNome, setEditedFichaNome] = useState('');
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [colorModalVisible, setColorModalVisible] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#4B6D9B');
    const [selectedBlockColor, setSelectedBlockColor] = useState(selectedColor);
    const [editBlockNameModalVisible, setEditBlockNameModalVisible] = useState(false);
    const [newBlockName, setNewBlockName] = useState(blockName);

    const router = useRouter();

    const saveColunas = async (colunas) => {
        try {
            const jsonValue = JSON.stringify(colunas);
            await AsyncStorage.setItem(`colunas_${blockName}`, jsonValue);
        } catch (e) {
            console.error("Failed to save colunas to AsyncStorage", e);
        }
    };

    const loadColunas = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(`colunas_${blockName}`);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error("Failed to load colunas from AsyncStorage", e);
            return [];
        }
    };

    const saveFichaInput = async (fichaId, inputText) => {
        try {
            await AsyncStorage.setItem(`ficha_${fichaId}`, inputText);
        } catch (e) {
            console.error("Failed to save ficha input to AsyncStorage", e);
        }
    };

    const loadFichaInput = async (fichaId) => {
        try {
            const inputText = await AsyncStorage.getItem(`ficha_${fichaId}`);
            return inputText || '';
        } catch (e) {
            console.error("Failed to load ficha input from AsyncStorage", e);
            return '';
        }
    };

    const saveBlockColor = async (color) => {
        try {
            await AsyncStorage.setItem(`blockColor_${blockName}`, color);
        } catch (e) {
            console.error("Failed to save block color to AsyncStorage", e);
        }
    };

    const loadBlockColor = async () => {
        try {
            const color = await AsyncStorage.getItem(`blockColor_${blockName}`);
            return color || '#4B6D9B';
        } catch (e) {
            console.error("Failed to load block color from AsyncStorage", e);
            return '#4B6D9B';
        }
    };

    useEffect(() => {
        const fetchColunas = async () => {
            const loadedColunas = await loadColunas();
            setColunas(loadedColunas);
        };
        fetchColunas();
    }, []);

    useEffect(() => {
        saveColunas(colunas);
    }, [colunas]);

    useEffect(() => {
        const fetchBlockColor = async () => {
            const loadedColor = await loadBlockColor();
            setSelectedColor(loadedColor);
            setSelectedBlockColor(loadedColor);
        };
        fetchBlockColor();
    }, []);
    useEffect(() => {
        const fetchBlockName = async () => {
            try {
                const savedBlockName = await AsyncStorage.getItem(`blockName_${blockName}`);
                if (savedBlockName) {
                    setNewBlockName(savedBlockName);
                }
            } catch (e) {
                console.error("Failed to load block name from AsyncStorage", e);
            }
        };
        fetchBlockName();
    }, [blockName]);

    const handleCreateColuna = () => {
        if (colunaNome.trim() === '') {
            return;
        }

        const newColunas = [...colunas, { id: generateUniqueId(), nome: colunaNome, fichas: [] }];
        setColunas(newColunas);
        setModalVisible(false);
        setColunaNome('');
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setColunaNome('');
    };

    const handleAddFicha = () => {
        setAddFichaModalVisible(true);
    };

    const handleCloseAddFichaModal = () => {
        setAddFichaModalVisible(false);
        setFichaNome('');
    };

    const generateUniqueId = () => {
        return '_' + Math.random().toString(36).substr(2, 9);
    };

    const handleCreateFicha = () => {
        const formattedDate = new Date().toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'short',
        }).replace('.', '');

        const lastColunaIndex = colunas.length - 1;
        const updatedColunas = [...colunas];
        updatedColunas[lastColunaIndex].fichas.push({ id: generateUniqueId(), nome: fichaNome, date: formattedDate });

        setColunas(updatedColunas);
        setAddFichaModalVisible(false);
        setFichaNome('');
    };

    const handleOpenFichaModal = async (ficha) => {
        setSelectedFicha(ficha);
        const loadedInput = await loadFichaInput(ficha.nome);
        setFichaInput1(loadedInput);
        setFichaModalVisible(true);
    };

    const handleCloseFichaModal = () => {
        setFichaModalVisible(false);
        setFichaInput1('');
        setSelectedFicha(null);
    };

    const handleSaveInput = async () => {
        if (selectedFicha) {
            await saveFichaInput(selectedFicha.nome, fichaInput1);
            alert('Ficha salva com sucesso!');
        }
    };

    const handleDeleteFicha = async () => {
        if (!selectedFicha) return;

        const updatedColunas = [...colunas];
        const columnIndex = updatedColunas.findIndex(coluna => coluna.fichas.some(ficha => ficha.id === selectedFicha.id));
        if (columnIndex !== -1) {
            const updatedFichas = updatedColunas[columnIndex].fichas.filter(ficha => ficha.id !== selectedFicha.id);
            updatedColunas[columnIndex].fichas = updatedFichas;
            setColunas(updatedColunas);

            // Salvar atualização no AsyncStorage
            await saveColunas(updatedColunas);
        }

        handleCloseFichaModal();
    };

    const handleDeleteColuna = async (index) => {
        const updatedColunas = [...colunas];
        updatedColunas.splice(index, 1); // Remove a coluna do array de colunas
        setColunas(updatedColunas); // Atualiza o estado com as colunas atualizadas

        // Salvar atualização no AsyncStorage
        await saveColunas(updatedColunas);
    };

    const handleEditFicha = (ficha) => {
        setEditingFichaId(ficha.id);
        setEditedFichaNome(ficha.nome);
    };

    const handleSaveEditedFicha = (ficha) => {
        const updatedColunas = [...colunas];
        const columnIndex = updatedColunas.findIndex(coluna => coluna.fichas.some(f => f.id === ficha.id));
        if (columnIndex !== -1) {
            const updatedFichas = updatedColunas[columnIndex].fichas.map(f => {
                if (f.id === ficha.id) {
                    return { ...f, nome: editedFichaNome };
                }
                return f;
            });
            updatedColunas[columnIndex].fichas = updatedFichas;
            setColunas(updatedColunas);

            // Salvar atualização no AsyncStorage
            saveColunas(updatedColunas);
        }

        setEditingFichaId(null);
    };

    const handleDeleteBlock = () => {
        // Lógica para deletar o bloco
        setSettingsModalVisible(false);
    };

    const handleColorSelection = (color) => {
        // Implemente aqui a lógica para alterar a cor do bloco
        // Exemplo: dispatch para Redux, setState, AsyncStorage, etc.
        setColorModalVisible(false); // Fechar o modal de cores após a seleção
    };

    const handleColorSelect = async (color) => {
        setSelectedColor(color);
        setSelectedBlockColor(color); // Atualiza a cor selecionada para o bloco
        await saveBlockColor(color); // Salva a cor no AsyncStorage para o bloco atual
    };

    const handleSaveColor = async () => {
        try {
            // Salvar a cor escolhida no AsyncStorage
            await saveBlockColor(selectedBlockColor);

            // Passar a cor de volta ao componente `Areadtrabalho` (se estiver usando navegação ou estado global)

            // Fechar o modal de cores
            setColorModalVisible(false);
        } catch (error) {
            console.error("Failed to save block color to AsyncStorage", error);
        }
    };
    const handleOpenEditBlockNameModal = () => {
        setEditBlockNameModalVisible(true);
    };

    const handleCloseEditBlockNameModal = () => {
        setEditBlockNameModalVisible(false);
    };

    const handleSaveBlockName = async () => {
        if (newBlockName.trim() === '') {
            return;
        }
        try {
            await AsyncStorage.setItem(`blockName_${blockName}`, newBlockName);
            setNewBlockName(newBlockName); // Atualiza o estado com o novo nome do bloco
            // Se necessário, atualize outras partes do estado aqui
            handleCloseEditBlockNameModal();
        } catch (e) {
            console.error("Failed to save block name", e);
        }
    };


    return (
        <View style={{ flex: 1 }}>
            <ImageBackground source={require('../img/gradient.png')} style={styles.navbar}>
                <TouchableOpacity style={styles.iconButton}>
                    <Icon name="menu" size={40} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>SCHEDULE</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <Icon name="account-circle" size={40} color="#fff" />
                </TouchableOpacity>
            </ImageBackground>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                    <Icon name="arrow-back" size={30} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerText}>   {blockName}</Text>
                <View style={styles.iconContainer}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => setModalVisible(true)}>
                        <Icon name="add" size={30} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => setSettingsModalVisible(true)}>
                        <Icon name="settings" size={30} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer}>
                {colunas.map((coluna, index) => (
                    <View key={index} style={styles.tarefasContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text style={styles.tarefasTitle}>{coluna.nome}</Text>
                            <TouchableOpacity onPress={() => handleDeleteColuna(index)}>
                                <Icon name="delete" size={17} color="red" />
                            </TouchableOpacity>
                        </View>
                        {coluna.fichas && coluna.fichas.map((ficha, fichaIndex) => (
                            <TouchableOpacity key={fichaIndex} style={styles.fichaContainer} onPress={() => handleOpenFichaModal(ficha)}>
                                <View style={styles.ficha}>
                                    {editingFichaId === ficha.id ? (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '94%' }}>
                                            <TextInput
                                                style={styles.editInput}
                                                value={editedFichaNome}
                                                onChangeText={setEditedFichaNome}
                                                onBlur={() => handleSaveEditedFicha(ficha)}
                                                autoFocus
                                            />
                                            <TouchableOpacity onPress={() => handleSaveEditedFicha(ficha)}>
                                                <Icon name="save" size={17} color="green" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '94%' }}>
                                            <Text style={styles.tarefaText}>{ficha.nome}</Text>
                                            <TouchableOpacity onPress={() => handleEditFicha(ficha)}>
                                                <Icon name="edit" size={17} color="black" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Icon name="schedule" size={12} color="#888" style={{ marginRight: 5 }} />
                                        <Text style={styles.tarefaDate}>{ficha.date}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.addButton} onPress={handleAddFicha}>
                            <Text style={styles.addButtonText}>+ Adicionar Ficha</Text>
                        </TouchableOpacity>
                    </View>
                ))}


                <Modal
                    visible={modalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={handleCloseModal}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Adicionar uma coluna</Text>
                            <Text style={styles.modald}>Nome da coluna</Text>
                            <TextInput
                                style={styles.input2}
                                placeholder="Escreva o nome aqui"
                                value={colunaNome}
                                onChangeText={setColunaNome}
                            />
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.createButton} onPress={handleCreateColuna}>
                                    <Text style={styles.createButtonText}>Criar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={addFichaModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={handleCloseAddFichaModal}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Adicionar Ficha</Text>
                            <Text style={styles.modald}>Nome da ficha</Text>
                            <TextInput
                                style={styles.input2}
                                placeholder="Escreva o nome da ficha aqui"
                                value={fichaNome}
                                onChangeText={setFichaNome}
                            />
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.cancelButton} onPress={handleCloseAddFichaModal}>
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.createButton} onPress={handleCreateFicha}>
                                    <Text style={styles.createButtonText}>Criar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
                <Modal
                    visible={fichaModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={handleCloseFichaModal}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{selectedFicha ? selectedFicha.nome : 'Detalhes da Ficha'}</Text>
                                <TouchableOpacity style={styles.closeIcon} onPress={handleCloseFichaModal}>
                                    <Icon name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="view-quilt" size={20} color="#888" style={{ marginRight: 1 }} />
                                <Text style={styles.modalSubtitle}>Descrição</Text>
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Escreva algo aqui"
                                value={fichaInput1}
                                onChangeText={setFichaInput1}
                                multiline={true}
                                numberOfLines={1} // Garante que ocupe apenas uma linha inicialmente
                            />

                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveInput}>
                                <Text style={styles.saveButtonText}>Salvar</Text>
                            </TouchableOpacity>

                            <View style={styles.inputWithIcon}>
                                <Icon name="schedule" size={20} color="#888" style={styles.iconInsideInput} />
                                <View style={styles.inputWithIconText}>
                                    <Text>Data</Text>
                                    <Text style={styles.timeText}>{selectedFicha ? selectedFicha.date : ''}</Text>
                                </View>
                                <View style={styles.deleteButtonContainer}>
                                    <TouchableOpacity onPress={handleDeleteFicha} style={styles.deleteButton}>
                                        <Icon name="delete" size={20} color="red" style={{ marginRight: 10 }} />
                                        <Text style={styles.deleteButtonText}>Deletar Ficha</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>
                <Modal
                    visible={settingsModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setSettingsModalVisible(false)}
                >
                    <View style={styles.settingsModalOverlay}>
                        <View style={styles.settingsModalContent}>
                            <View style={styles.settingsHeader}>
                                <Text style={styles.settingsTitle}>Configurações</Text>
                                <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                                    <Icon name="settings" size={24} color="#fff" style={styles.settingsIcon} />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={styles.settingsOption}
                                onPress={() => {
                                    setSettingsModalVisible(false); // Fechar o modal de configurações atual
                                    setColorModalVisible(true); // Abrir o modal de cores
                                }}
                            >
                                <Icon name="palette" size={24} color="#fff" />
                                <Text style={styles.settingsOptionText}>Alterar cor do bloco</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.settingsOption}
                                onPress={() => {
                                    setSettingsModalVisible(false); // Fechar o modal de configurações atual
                                    handleOpenEditBlockNameModal(); // Abrir o modal de edição do nome do bloco
                                }}
                            >
                                <Icon name="edit" size={24} color="#fff" />
                                <Text style={styles.settingsOptionText}>Alterar nome do bloco</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
                <Modal
                    visible={colorModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setColorModalVisible(false)}
                >
                    <View style={styles.colorModalOverlay}>
                        <View style={styles.colorModalContent}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity style={styles.backButton} onPress={() => setColorModalVisible(false)}>
                                    <Icon name="arrow-back" size={24} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.modalHeaderText}>Alterar cor do bloco</Text>
                            </View>

                            {/* Linha 1 de cores */}
                            <View style={styles.colorOptionsRow}>
                                <TouchableOpacity onPress={() => handleColorSelect('#4B6D9B')}>
                                    <View style={[styles.colorCircle, styles.blue, selectedColor === '#4B6D9B' && { borderWidth: 2, borderColor: 'white' }]} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleColorSelect('#80C49F')}>
                                    <View style={[styles.colorCircle, styles.green, selectedColor === '#80C49F' && { borderWidth: 2, borderColor: 'white' }]} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleColorSelect('#E8CB73')}>
                                    <View style={[styles.colorCircle, styles.yellow, selectedColor === '#E8CB73' && { borderWidth: 2, borderColor: 'white' }]} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleColorSelect('#CD6051')}>
                                    <View style={[styles.colorCircle, styles.red, selectedColor === '#CD6051' && { borderWidth: 2, borderColor: 'white' }]} />
                                </TouchableOpacity>
                            </View>

                            {/* Linha 2 de cores */}
                            <View style={styles.colorOptionsRow}>
                                <TouchableOpacity onPress={() => handleColorSelect('#D17BC1')}>
                                    <View style={[styles.colorCircle, styles.pink, selectedColor === '#D17BC1' && { borderWidth: 2, borderColor: 'white' }]} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleColorSelect('#8F5EB6')}>
                                    <View style={[styles.colorCircle, styles.purple, selectedColor === '#8F5EB6' && { borderWidth: 2, borderColor: 'white' }]} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleColorSelect('#6DCFCF')}>
                                    <View style={[styles.colorCircle, styles.cyan, selectedColor === '#6DCFCF' && { borderWidth: 2, borderColor: 'white' }]} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleColorSelect('#ED942B')}>
                                    <View style={[styles.colorCircle, styles.orange, selectedColor === '#ED942B' && { borderWidth: 2, borderColor: 'white' }]} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.saveButton2} onPress={handleSaveColor}>
                                <Text style={styles.saveButtonText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
                <Modal
                    visible={editBlockNameModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={handleCloseEditBlockNameModal}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Alterar nome do bloco</Text>
                            <TextInput
                                style={styles.input2}
                                placeholder="Digite o novo nome"
                                value={newBlockName}
                                onChangeText={setNewBlockName}
                            />
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.cancelButton} onPress={handleCloseEditBlockNameModal}>
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.createButton} onPress={handleSaveBlockName}>
                                    <Text style={styles.createButtonText}>Salvar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View>

    );
}

const styles = StyleSheet.create({
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 15,
        height: 120,
        top: -49,
        paddingTop: StatusBar.currentHeight || 20,
    },
    iconButton: {
        padding: 10,
    },
    scrollContainer: {
        flex: 1,
    },
    title: {
        fontSize: 25,
        color: 'white',
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 15,
        top: -20,
    },
    headerText: {
        fontSize: 24,
        color: '#1E90FF',
        fontWeight: 'bold',
        right: 80,
    },
    iconContainer: {
        flexDirection: 'row',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: 300,
        backgroundColor: '#333',
        borderRadius: 10,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 30,
        textAlign: 'left',
    },
    modalSubtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        top: 10
    },
    modald: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        textAlign: 'left',
    },
    input: {
        width: '100%',
        height: 100,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 25,
        paddingHorizontal: 10,
        color: 'gray',
        backgroundColor: 'white',

    },
    input2: {
        width: '100%',
        height: 30,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 25,
        paddingHorizontal: 10,
        color: 'gray',
        backgroundColor: 'white',

    },
    buttonContainer: {
        flexDirection: 'row',
    },
    cancelButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        marginRight: 10,
        borderColor: '#CD6051',
        borderWidth: 1,
        borderRadius: 50,
        backgroundColor: 'white',
    },
    cancelButtonText: {
        color: '#CD6051',
        fontSize: 16,
    },
    createButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#80C49F',
        backgroundColor: 'white',
    },
    createButtonText: {
        color: '#80C49F',
        fontSize: 16,
    },
    tarefasContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        marginHorizontal: 30,
        marginBottom: 30,
        elevation: 3,
        top: -4,
    },
    tarefasTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#4682B4',
    },
    addButton: {
        backgroundColor: '#4682B4',
        paddingVertical: 4,
        borderRadius: 10,
        alignItems: 'center',
        width: 150,
        alignSelf: 'flex-end',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    fichaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    ficha: {
        backgroundColor: '#fff',
        padding: 7,
        borderRadius: 50,
        marginBottom: 10,
        elevation: 1,
        paddingHorizontal: 'auto',
        width: '100%',
    },
    tarefaText: {
        fontSize: 15,
        marginBottom: 5,
    },
    tarefaDate: {
        fontSize: 12,
        color: '#888',
    },
    editButton: {
        padding: 5,
    },
    closeIcon: {
        padding: 10,
        top: -13,
        left: '280%'
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
        backgroundColor: 'white',
        paddingHorizontal: 10,
        marginBottom: 55,
    },
    iconInsideInput: {
        marginRight: -1,
    },
    inputWithIconText: {
        flexDirection: 'column',
        marginLeft: 10,
    },
    timeText: {
        color: '#888',
        fontSize: 12,
        marginTop: 5,
    },
    deleteButton: {
        flexDirection: 'row', // Para alinhar o ícone e o texto na mesma linha
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20, // Ajuste conforme necessário
        borderColor: '#CD6051',
        borderWidth: 1,
        borderRadius: 50,
        backgroundColor: 'white',
        top: 60,
        right: 82,
    },
    deleteButtonTouchable: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    deleteButtonText: {
        color: '#CD6051',
        fontSize: 16,
        marginLeft: 0, // Espaçamento entre o ícone e o texto
    },
    saveButton: {
        position: 'absolute',
        top: 80,  // Ajuste conforme necessário
        right: 22, // Ajuste conforme necessário
        backgroundColor: 'white',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'green',

    },
    saveButton2: {
        backgroundColor: 'white',
        paddingVertical: 2,
        paddingHorizontal: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'green',
        width: 70,
        left: 147,

    },

    saveButtonText: {
        color: 'green',
        fontSize: 14,
        fontWeight: 'bold',


    },
    settingsModalOverlay: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        padding: 3,
        top: 155
    },
    settingsModalContent: {
        width: 300,
        backgroundColor: '#333',
        borderRadius: 10,
        padding: 20,
        alignItems: 'flex-start',
    },
    settingsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    settingsTitle: {
        fontSize: 20,
        color: '#fff',
    },
    settingsIcon: {
        marginLeft: 'auto',
    },
    settingsOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    settingsOptionText: {
        fontSize: 16,
        color: '#fff',
        marginLeft: 10,
    },
    colorModalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    colorModalContent: {
        width: 270,
        backgroundColor: '#333',
        borderRadius: 10,
        padding: 20,
    },
    colorModalTitle: {
        fontSize: 20,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    colorOption: {
        width: 100,
        height: 40,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    colorOptionText: {
        color: '#fff',
        fontSize: 16,
    },
    colorModalCancel: {
        marginTop: 10,
        color: 'blue',
        fontSize: 18,
    },
    colorOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    colorCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,

    },
    blue: {
        backgroundColor: '#4B6D9B',
    },
    green: {
        backgroundColor: '#80C49F',
    },
    yellow: {
        backgroundColor: '#E8CB73',
    },
    red: {
        backgroundColor: '#CD6051',
    },
    pink: {
        backgroundColor: '#D17BC1',
    },
    purple: {
        backgroundColor: '#8F5EB6',
    },
    cyan: {
        backgroundColor: '#6DCFCF',
    },
    orange: {
        backgroundColor: '#ED942B',
    },
    colorOptionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    backButton: {
        alignSelf: 'start   ',
        marginBottom: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalHeaderText: {
        color: 'white',
        fontSize: 20,
        marginLeft: 10,
        top: -5,
    },
});
