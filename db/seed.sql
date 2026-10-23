-- =============================================================
-- Tuck In Tuckshop - Sample data (a typical Windhoek tuckshop)
-- User accounts are created by db/database.js so that their
-- passwords are hashed properly (see README for login details).
-- =============================================================

INSERT INTO categories (name, description) VALUES
    ('Rolls & hot food', 'Made at the counter while you wait'),
    ('Chips & snacks',   'Packets and quick bites'),
    ('Sweets',           'Chocolates, sweets and treats'),
    ('Cold drinks',      'Straight from the fridge'),
    ('Hot drinks',       'Tea, coffee and hot chocolate');

INSERT INTO products (category_id, name, description, price, stock_quantity, image_url) VALUES
    (1, 'Russian roll',          'Grilled russian sausage in a soft white roll with tomato sauce and mustard.', 28.00, 40, '/images/menu/russian-roll.svg'),
    (1, 'Cheese russian roll',   'A russian roll with melted cheddar on top.',                                  32.00, 30, '/images/menu/cheese-russian-roll.svg'),
    (1, 'Boerewors roll',        'Grilled boerewors in a roll with fried onions and tomato relish.',            35.00, 30, '/images/menu/boerewors-roll.svg'),
    (1, 'Mince roll',            'Savoury beef mince in a toasted roll.',                                       25.00, 25, '/images/menu/mince-roll.svg'),
    (1, 'Chip roll',             'Slap chips with salt, vinegar and tomato sauce in a soft roll.',              18.00, 40, '/images/menu/chip-roll.svg'),
    (1, 'Russian & chips',       'A whole russian with a small slap chips.',                                    38.00, 20, '/images/menu/russian-and-chips.svg'),
    (1, 'Vetkoek & mince',       'Freshly fried vetkoek filled with savoury mince.',                            15.00, 30, '/images/menu/vetkoek-mince.svg'),
    (1, 'Slap chips (small)',    'Soft chips with salt and vinegar.',                                           15.00, 50, '/images/menu/slap-chips-small.svg'),
    (1, 'Slap chips (large)',    'Soft chips with salt and vinegar.',                                           25.00, 40, '/images/menu/slap-chips-large.svg'),
    (1, 'Chicken pie',           'Creamy chicken filling in flaky pastry.',                                     22.00, 20, '/images/menu/chicken-pie.svg'),
    (2, 'Simba chips 36g',       'Salt & vinegar, cheese & onion or tomato sauce.',                             10.00, 80, '/images/menu/simba-chips.svg'),
    (2, 'NikNaks 55g',           'Cheese-flavoured maize puffs.',                                               10.00, 60, '/images/menu/niknaks.svg'),
    (2, 'Doritos 45g',           'Sweet chilli pepper.',                                                        14.00, 40, '/images/menu/doritos.svg'),
    (2, 'Popcorn',               'Butter popcorn, popped at the counter.',                                      10.00, 30, '/images/menu/popcorn.svg'),
    (2, 'Sausage roll',          'Pork sausage baked in puff pastry.',                                          16.00, 25, '/images/menu/sausage-roll.svg'),
    (3, 'Bar-One',               'Chocolate bar with nougat and caramel.',                                      13.00, 40, '/images/menu/bar-one.svg'),
    (3, 'Lunch Bar',             'Chocolate bar with peanuts, caramel and wafer.',                              13.00, 40, '/images/menu/lunch-bar.svg'),
    (3, 'Jelly Tots 100g',       'Fruit-flavoured jelly sweets.',                                               15.00, 30, '/images/menu/jelly-tots.svg'),
    (3, 'Chappies bubblegum',    'One piece of bubblegum.',                                                      1.00, 200, '/images/menu/chappies.svg'),
    (3, 'Glazed doughnut',       'Ring doughnut with a sugar glaze.',                                           10.00, 0, '/images/menu/glazed-doughnut.svg'),
    (4, 'Coca-Cola 500ml',       'Ice-cold bottle.',                                                            16.00, 60, '/images/menu/coca-cola.svg'),
    (4, 'Coke Zero 500ml',       'No sugar.',                                                                   16.00, 30, '/images/menu/coke-zero.svg'),
    (4, 'Fanta Orange 500ml',    'Ice-cold bottle.',                                                            16.00, 40, '/images/menu/fanta-orange.svg'),
    (4, 'Fanta Grape 500ml',     'Ice-cold bottle.',                                                            16.00, 30, '/images/menu/fanta-grape.svg'),
    (4, 'Sprite 500ml',          'Ice-cold bottle.',                                                            16.00, 30, '/images/menu/sprite.svg'),
    (4, 'Stoney Ginger Beer 500ml', 'Ice-cold bottle.',                                                         16.00, 25, '/images/menu/stoney.svg'),
    (4, 'Reboost 500ml',         'Energy drink.',                                                               18.00, 40, '/images/menu/reboost.svg'),
    (4, 'Fruitree juice 350ml',  'Mango, orange or tropical.',                                                  17.00, 30, '/images/menu/fruitree.svg'),
    (4, 'Still water 500ml',     'Bottled still water.',                                                        10.00, 60, '/images/menu/water.svg'),
    (5, 'Tea',                   'Five Roses with milk and sugar on the side.',                                 10.00, 100, '/images/menu/tea.svg'),
    (5, 'Coffee',                'Instant coffee with milk.',                                                   12.00, 100, '/images/menu/coffee.svg'),
    (5, 'Hot chocolate',         'Made with hot milk.',                                                         15.00, 50, '/images/menu/hot-chocolate.svg');

UPDATE products SET is_available = 0 WHERE stock_quantity = 0;
