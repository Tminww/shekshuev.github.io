create table if not exists users (
    id bigserial,
    user_name varchar(30) not null,
    first_name varchar(30) not null,
    last_name varchar(30) not null,
    password_hash varchar(72) not null,
    status smallint default 1,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    deleted_at timestamp,
    constraint pk__users primary key(id),
    constraint chk__users__status check(status in (0, 1))
);

create unique index idx__users__user_name on users(user_name) where (deleted_at is null);

create table if not exists posts (
    id bigserial,
    text varchar(280) not null,
    reply_to_id bigint,
    user_id bigint,
    created_at timestamp not null default now(),
    deleted_at timestamp,
    constraint pk__posts primary key(id),
    constraint fk__posts__user_id foreign key(user_id) references users(id),
    constraint fk__posts__reply_to_id foreign key(reply_to_id) references posts(id)
);

create table if not exists likes (
    user_id bigint,
    post_id bigint,
    created_at timestamp not null default now(),
    constraint pk__likes primary key (user_id, post_id),
    constraint fk__likes__user_id foreign key (user_id) references users(id),
    constraint fk__likes__post_id foreign key (post_id) references posts(id)
);

create table if not exists views (
    user_id bigint,
    post_id bigint,
    created_at timestamp not null default now(),
    constraint pk__views primary key (user_id, post_id),
    constraint fk__views__user_id foreign key (user_id) references users(id),
    constraint fk__views__post_id foreign key (post_id) references posts(id)
);