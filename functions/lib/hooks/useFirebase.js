"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFirebase = void 0;
const react_1 = require("react");
const app_1 = require("firebase/compat/app");
const firebase_1 = require("../firebase");
const uuid_1 = require("uuid");
const user_1 = require("../types/user");
const DEFAULT_META = {
    plan: 'free',
    launchLimit: 30, // Limite para usuários free
    launchCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
};
const useFirebase = (userId) => {
    const [lancamentos, setLancamentos] = (0, react_1.useState)([]);
    const [userMeta, setUserMeta] = (0, react_1.useState)(null);
    const [firestoreUser, setFirestoreUser] = (0, react_1.useState)(null);
    const [isReady, setIsReady] = (0, react_1.useState)(false);
    // Propriedade Derivada: Verifica Premium Real (Firestore)
    const isPremium = (0, react_1.useMemo)(() => (0, user_1.isAppPremium)(firestoreUser), [firestoreUser]);
    // Limite visual e lógico
    const usagePercentage = (0, react_1.useMemo)(() => {
        if (!userMeta)
            return 0;
        if (isPremium)
            return 0; // Premium não tem barra de limite
        return Math.min(100, (userMeta.launchCount / userMeta.launchLimit) * 100);
    }, [userMeta, isPremium]);
    const isLimitReached = (0, react_1.useMemo)(() => {
        if (!userMeta)
            return false;
        if (isPremium)
            return false; // Premium ignora limite
        return userMeta.launchCount >= userMeta.launchLimit;
    }, [userMeta, isPremium]);
    (0, react_1.useEffect)(() => {
        let metaRef = null;
        let lancamentosRef = null;
        let unsubFirestore = null;
        const init = async () => {
            await firebase_1.authReadyPromise;
            setIsReady(true);
            // --- 1. Realtime DB (Dados de Lançamentos) ---
            const userRootPath = `users/${userId}`;
            const metaPath = `${userRootPath}/meta`;
            const lancamentosPath = `${userRootPath}/gerenciadorFinanceiro/lancamentos`;
            // Cria Meta Dados se não existirem
            metaRef = firebase_1.database.ref(metaPath);
            metaRef.once('value').then((snapshot) => {
                if (!snapshot.exists()) {
                    const rootRef = firebase_1.database.ref(userRootPath);
                    rootRef.update({
                        meta: {
                            ...DEFAULT_META,
                            createdAt: app_1.default.database.ServerValue.TIMESTAMP,
                            updatedAt: app_1.default.database.ServerValue.TIMESTAMP
                        }
                    });
                }
            }).catch(err => console.error("Erro meta:", err));
            metaRef.on('value', (snapshot) => {
                const data = snapshot.val();
                setUserMeta(data ? data : DEFAULT_META);
            });
            lancamentosRef = firebase_1.database.ref(lancamentosPath);
            lancamentosRef.on('value', (snapshot) => {
                const data = snapshot.val();
                const loadedLancamentos = data ? Object.entries(data).map(([key, value]) => ({
                    ...value,
                    _firebaseKey: key
                })) : [];
                setLancamentos(loadedLancamentos.reverse());
            });
            // --- 2. Firestore (Assinatura) ---
            // Apenas se não for usuário guest/placeholder
            if (userId && userId !== 'guest_placeholder') {
                const userDocRef = firebase_1.db.collection('users').doc(userId);
                unsubFirestore = userDocRef.onSnapshot((docSnap) => {
                    if (docSnap.exists) {
                        setFirestoreUser(docSnap.data());
                    }
                });
            }
        };
        if (userId && userId !== 'guest_placeholder') {
            init();
        }
        else {
            setLancamentos([]);
            setUserMeta(null);
            setFirestoreUser(null);
        }
        return () => {
            if (metaRef)
                metaRef.off();
            if (lancamentosRef)
                lancamentosRef.off();
            if (unsubFirestore)
                unsubFirestore();
        };
    }, [userId]);
    const saveLancamento = async (lancamento) => {
        if (!isReady)
            throw new Error("Conexão pendente.");
        // Bloqueio do Freemium
        if (isLimitReached) {
            throw new Error("LIMIT_REACHED");
        }
        try {
            const newKey = (0, uuid_1.v4)();
            const listRef = firebase_1.database.ref(`users/${userId}/gerenciadorFinanceiro/lancamentos`);
            const newRef = listRef.push();
            const pushKey = newRef.key;
            if (!pushKey)
                throw new Error("Erro chave Firebase");
            const updates = {};
            updates[`users/${userId}/gerenciadorFinanceiro/lancamentos/${pushKey}`] = { ...lancamento, id: newKey };
            updates[`users/${userId}/meta/launchCount`] = app_1.default.database.ServerValue.increment(1);
            updates[`users/${userId}/meta/updatedAt`] = app_1.default.database.ServerValue.TIMESTAMP;
            await firebase_1.database.ref().update(updates);
        }
        catch (error) {
            console.error('Save Error:', error);
            if (error.message === 'LIMIT_REACHED')
                throw error;
            throw error;
        }
    };
    const deleteLancamento = async (id) => {
        if (!isReady)
            return;
        const item = lancamentos.find(l => l.id === id);
        if (item && item._firebaseKey) {
            try {
                const updates = {};
                updates[`users/${userId}/gerenciadorFinanceiro/lancamentos/${item._firebaseKey}`] = null;
                // Decrementa contador (opcional, alguns freemiums não devolvem o crédito, mas aqui devolvemos)
                updates[`users/${userId}/meta/launchCount`] = app_1.default.database.ServerValue.increment(-1);
                updates[`users/${userId}/meta/updatedAt`] = app_1.default.database.ServerValue.TIMESTAMP;
                await firebase_1.database.ref().update(updates);
            }
            catch (error) {
                console.error("Delete error:", error);
                throw error;
            }
        }
    };
    return {
        lancamentos,
        userMeta,
        saveLancamento,
        deleteLancamento,
        isPremium,
        isLimitReached,
        usagePercentage
    };
};
exports.useFirebase = useFirebase;
//# sourceMappingURL=useFirebase.js.map