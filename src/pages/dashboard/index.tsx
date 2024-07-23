import { GetServerSideProps } from 'next';
import { ChangeEvent, FormEvent, useState, useEffect } from 'react';
import styles from './styles.module.css';
import Head from 'next/head';

import { getSession } from 'next-auth/react'
import { Textarea } from '@/components/textarea';
import { FiShare2 } from 'react-icons/fi'
import { FaTrash } from 'react-icons/fa'

import { toast } from 'react-toastify'

import { db } from '../../services/firebaseConnection'
import {
    addDoc,
    collection,
    query,
    orderBy,
    where,
    onSnapshot,
    doc,
    deleteDoc
} from 'firebase/firestore'
import Link from 'next/link';

interface HomeProps {
    user: {
        email: string
    }
}

interface TasksProps {
    id: string;
    created: Date;
    public: boolean;
    tarefa: string;
    user: string;
}

export default function Dashboard({ user }: HomeProps) {

    const [input, setInput] = useState("");
    const [publicTask, setPublicTask] = useState(false);
    const [tasks, setTasks] = useState<TasksProps[]>([])

    useEffect(() => {
        async function loadTarefas() {

            const tarefasRef = collection(db, "tarefas");
            const q = query(
                tarefasRef,
                orderBy("created", "desc"),
                where("user", "==", user?.email)
            )

            onSnapshot(q, (snapshot) => {
                let lista = [] as TasksProps[];

                snapshot.forEach((doc) => {
                    lista.push({
                        id: doc.id,
                        tarefa: doc.data().tarefa,
                        created: doc.data().created,
                        user: doc.data().user,
                        public: doc.data().public
                    })
                })

                setTasks(lista)
            })
        }
        loadTarefas();
    }, [user?.email])

    function handleChangePublic(e: ChangeEvent<HTMLInputElement>) {
        setPublicTask(e.target.checked)
    }
    async function handleRegisterTask(e: FormEvent) {
        e.preventDefault();

        if (input === '') return toast.error('Campo tarefa vazio!');

        try {
            await addDoc(collection(db, "tarefas"), {
                tarefa: input,
                created: new Date(),
                user: user?.email,
                public: publicTask
            });
            setInput("")
            setPublicTask(false)

            toast.success('Tarefa adicionada com sucesso!')
        } catch (err) {
            toast.error('Ocorreu um erro ao deleta a tarefa, verifique sua conexão com a internet')
        }


    }

    async function handleShare(id: string) {
        await navigator.clipboard.writeText(
            `${process.env.NEXT_PUBLIC_URL}/task/${id}`
        )
        toast.success('url copiada com sucesso')
    }

    async function handleDeleteTask(id: string) {
        try {
            const docRef = doc(db, "tarefas", id);
            await deleteDoc(docRef)
            toast.success('Comentário apagado com sucesso!')
        } catch (err) {
            toast.error('Error ao apagar o comentário, verique sua conexão com a internet')
        }
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Meu painel de tarefas</title>
            </Head>

            <main className={styles.main}>
                <section className={styles.content}>
                    <div className={styles.contentForm}>
                        <h1 className={styles.title}>Qual sua tarefa?</h1>
                        <form onSubmit={handleRegisterTask}>
                            <Textarea
                                placeholder='Digite qual sua tarefa'
                                value={input}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                            />

                            <div className={styles.checkboxArea}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={publicTask}
                                    onChange={handleChangePublic}
                                />
                                <label>Deixar tarefa publica?</label>
                            </div>
                            <button type="submit" className={styles.button}>
                                Registrar
                            </button>
                        </form>
                    </div>
                </section>

                <section className={styles.taskContainer}>
                    <h1>Minhas tarefas</h1>

                    {tasks.map((item) => (
                        <article key={item.id} className={styles.task}>
                            {item.public && (
                                <div className={styles.tagContainer}>
                                    <label className={styles.tag}>PUBLICO</label>
                                    <button className={styles.shareButton} onClick={() => handleShare(item.id)}>
                                        <FiShare2 size={22} color='#3183ff' />
                                    </button>
                                </div>
                            )}

                            <div className={styles.taskContent}>
                                {item.public ? (
                                    <Link href={`/task/${item.id}`}>
                                        <p>{item.tarefa}</p>
                                    </Link>
                                ) : (
                                    <p>{item.tarefa}</p>
                                )}

                                <button className={styles.trashButton} onClick={() => handleDeleteTask(item.id)}>
                                    <FaTrash size={24} color='#ea3140' />
                                </button>
                            </div>
                        </article>
                    ))}

                </section>
            </main>

        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {

    const session = await getSession({ req })
    console.log(session)
    if (!session?.user) {
        return {
            redirect: {
                destination: '/',
                permanent: false
            }
        }
    }

    return {
        props: {
            user: {
                email: session?.user?.email
            }
        }
    }
}
