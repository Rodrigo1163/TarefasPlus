import { GetServerSideProps } from "next";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useSession } from 'next-auth/react'
import Head from "next/head";
import styles from './styles.module.css'
import { db } from '../../services/firebaseConnection';
import { toast } from 'react-toastify';

import {
    doc,
    collection,
    query,
    where,
    getDoc,
    addDoc,
    getDocs,
    deleteDoc
} from 'firebase/firestore'
import { redirect } from "next/dist/server/api-utils";
import { Textarea } from "@/components/textarea";
import { FaTrash } from 'react-icons/fa'
import { CiWarning } from "react-icons/ci";

interface TaskProps {
    item: {
        tarefa: string;
        created: string;
        public: boolean;
        user: string;
        taskId: string
    },
    allComment: CommentsProps[]
}

interface CommentsProps {
    id: string;
    comment: string;
    taskId: string;
    user: string;
    name: string;
}

export default function Task({ item, allComment }: TaskProps) {

    const { data: session, status } = useSession();
    const [input, setInput] = useState('');
    const [msg, setMsg] = useState('');
    const [comments, setComments] = useState<CommentsProps[]>(allComment || [])

    async function handleComment(event: FormEvent) {
        event.preventDefault()

        if (input === '') return toast.error('Campo comentário vazio!');

        if (!session?.user?.email || !session?.user?.name) {
            setMsg('Para realizar um comentário, você precisa realizar um login')
            return
        };


        try {
            const docRef = await addDoc(collection(db, "comments"), {
                comment: input,
                created: new Date(),
                user: session?.user?.email,
                name: session?.user?.name,
                taskId: item?.taskId
            })

            const data = {
                id: docRef.id,
                comment: input,
                user: session?.user?.email,
                name: session?.user?.name,
                taskId: item?.taskId
            }

            setComments((oldItems) => [...oldItems, data])

            setInput("");
        } catch (err) {
            console.log(err)
        }
    }

    async function handleDeleteComment(id: string) {
        try {
            const docRef = doc(db, "comments", id)
            await deleteDoc(docRef);

            const deletComment = comments.filter((item) => item.id !== id);

            setComments(deletComment)
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Detalhes da tarefa</title>
            </Head>
            <main className={styles.main}>
                {status === 'loading' ? (
                    <span></span>
                ) : !session?.user && (
                    <div className={styles.containerMsg}>
                        <span className={styles.msg}>Para realizar um comentário, você precisa realizar um login</span>
                        <CiWarning size={24} />
                    </div>
                )}

                <h1>tarefas</h1>
                <article className={styles.task}>
                    <p>{item.tarefa}</p>
                </article>
            </main>

            <section className={styles.commnentsContainer}>
                <h2>Deixar Comentário</h2>

                <form onSubmit={handleComment}>
                    <Textarea
                        placeholder="Digite seu comentário..."
                        value={input}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                    />

                    <button
                        disabled={!session?.user}
                        className={styles.button}
                    >
                        Enviar comentário
                    </button>
                </form>
            </section>

            <section className={styles.commnentsContainer}>
                <h2>Todos os Comentários</h2>
                {comments.length === 0 && (
                    <span>Nenhum comentário foi encontrado...</span>
                )}

                {comments.map((item) => (
                    <article key={item.id} className={styles.comment}>
                        <div className={styles.headerComment}>
                            <label className={styles.commnentsLabel}>{item.name}</label>
                            {item.user === session?.user?.email && (
                                <button className={styles.buttonTrash} onClick={() => handleDeleteComment(item.id)}>
                                    <FaTrash size={18} color="#EA3140" />
                                </button>
                            )}
                        </div>
                        <p>{item.comment}</p>
                    </article>
                ))}
            </section>

        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {

    const id = params?.id as string
    const docRef = doc(db, "tarefas", id)

    const q = query(collection(db, "comments"), where("taskId", "==", id))
    const snapshotComments = await getDocs(q)

    let allComents: CommentsProps[] = [];
    snapshotComments.forEach((doc) => {
        allComents.push({
            id: doc.id,
            comment: doc.data().comment,
            user: doc.data().user,
            name: doc.data().name,
            taskId: doc.data().taskId
        })
    })
    const snapshot = await getDoc(docRef)

    if (snapshot.data() === undefined) {
        return {
            redirect: {
                destination: '/',
                permanent: false
            }
        }
    }
    if (!snapshot.data()?.public) {
        return {
            redirect: {
                destination: '/',
                permanent: false
            }
        }

    }

    const miliseconds = snapshot.data()?.created?.seconds * 1000;

    const task = {
        tarefa: snapshot.data()?.tarefa,
        public: snapshot.data()?.public,
        created: new Date(miliseconds).toLocaleDateString(),
        user: snapshot.data()?.user,
        taskId: id,
    }


    return {
        props: {
            item: task,
            allComment: allComents
        }
    }
}